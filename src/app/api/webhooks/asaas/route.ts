import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { applyAsaasPayment } from "@/lib/asaas-billing";
import { AsaasHttpError, getPayment, type AsaasPayment } from "@/lib/asaas";
import { adoptSubscriptionFromWebhook } from "@/lib/checkout-claim";
import { beginWebhookEvent, failWebhookEvent, finishWebhookEvent, ledgerMissing, webhookEventId } from "@/lib/asaas-webhook-ledger";
import { prisma } from "@/lib/db";

type WebhookPayment = { id?: unknown; subscription?: unknown; customer?: unknown; dueDate?: unknown; value?: unknown };

function str(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

/**
 * Current state of the payment. Asaas answers 404 for a deleted payment; only then the (token-authenticated)
 * webhook body is used, and only for PAYMENT_DELETED. Any other 404 means there is nothing left to reconcile.
 */
async function currentPayment(event: string, sent: WebhookPayment & { id: string }): Promise<AsaasPayment | null> {
  try {
    return await getPayment(sent.id);
  } catch (error) {
    if (!(error instanceof AsaasHttpError) || error.status !== 404) throw error;
    if (event !== "PAYMENT_DELETED") return null;
    return {
      id: sent.id,
      status: "DELETED",
      customer: str(sent.customer),
      subscription: str(sent.subscription),
      dueDate: str(sent.dueDate),
      value: typeof sent.value === "number" ? sent.value : undefined,
    };
  }
}

export async function POST(request: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!expected) return NextResponse.json({ error: "Webhook indisponível." }, { status: 503 });
  const sent = Buffer.from(request.headers.get("asaas-access-token") ?? "");
  const secret = Buffer.from(expected);
  if (sent.length !== secret.length || !timingSafeEqual(sent, secret)) return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: unknown; event?: unknown; payment?: WebhookPayment; subscription?: { id?: unknown } } | null;
  if (!body || typeof body !== "object" || typeof body.event !== "string") return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  const event = body.event;
  const paymentId = str(body.payment?.id);
  const subscriptionId = str(body.subscription?.id);
  // Ledger keyed by Asaas event.id: an event already processed is acknowledged without being applied again.
  // A body without a usable id is still processed (the handling below is idempotent), just not recorded.
  let eventId = webhookEventId(body.id);
  try {
    if (eventId) {
      const start = await beginWebhookEvent({ id: eventId, event, paymentId, subscriptionId: subscriptionId ?? str(body.payment?.subscription) });
      if (start === "duplicate") return NextResponse.json({ ok: true, duplicate: true });
    }
  } catch (error) {
    // Ledger table not migrated yet: keep processing without it instead of making Asaas pause the queue.
    if (!ledgerMissing(error)) return NextResponse.json({ error: "Falha temporária de reconciliação." }, { status: 503 });
    eventId = null;
  }
  try {
    if (event.startsWith("PAYMENT_") && paymentId) {
      // Never trust a stale webhook status. Pull the current payment from the provider.
      const payment = await currentPayment(event, { ...body.payment, id: paymentId });
      if (payment) {
        const row = await applyAsaasPayment(payment);
        if (!row && payment.customer && payment.subscription && payment.status !== "DELETED") {
          // The first webhook may arrive before the checkout route persisted the new subscription ID.
          // Adopt it when Asaas confirms it belongs to this customer's in-flight claim, then apply again.
          if (await adoptSubscriptionFromWebhook(payment.customer, payment.subscription)) await applyAsaasPayment(payment);
        }
      }
    }
    if (event === "SUBSCRIPTION_DELETED" && subscriptionId) {
      // Conditional on the original provider subscription, never cancel a replacement.
      await prisma.subscription.updateMany({ where: { providerSubscriptionId: subscriptionId, provider: "asaas", status: { not: "canceled" } }, data: { status: "canceled" } });
    }
    // Anything not reconciled here (e.g. an unknown subscription) is acknowledged: persistent non-2xx answers
    // make Asaas pause the whole webhook queue. The status endpoint still reconciles confirmed payments.
    if (eventId) {
      // If only this bookkeeping write fails, a redelivery just runs the idempotent handling again.
      await finishWebhookEvent(eventId).catch(() => undefined);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (eventId) await failWebhookEvent(eventId, error);
    // Transient failure (Asaas/DB unavailable, concurrent update): ask Asaas to retry. No payload or secret is echoed.
    return NextResponse.json({ error: "Falha temporária de reconciliação." }, { status: 503 });
  }
}
