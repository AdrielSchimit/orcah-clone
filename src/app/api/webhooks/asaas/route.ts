import { NextResponse } from "next/server";
import { applyAsaasPayment, markUnpaid } from "@/lib/asaas-billing";
import { prisma } from "@/lib/db";
import type { AsaasPayment } from "@/lib/asaas";

export async function POST(request: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json({ error: "Webhook sem token." }, { status: 503 });
  }

  const sent = request.headers.get("asaas-access-token") ?? "";
  if (sent !== expected) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const body = (await request.json()) as {
    event?: string;
    payment?: AsaasPayment;
    subscription?: { id?: string };
  };

  if (body.payment?.id) {
    await applyAsaasPayment(body.payment);
  }

  const subscriptionId = body.subscription?.id || body.payment?.subscription;
  if (body.event === "SUBSCRIPTION_DELETED" && subscriptionId) {
    const row = await prisma.subscription.findFirst({
      where: { providerSubscriptionId: subscriptionId },
    });
    if (row) await markUnpaid(row.companyId, "canceled");
  }

  return NextResponse.json({ ok: true });
}
