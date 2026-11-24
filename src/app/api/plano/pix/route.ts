import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import {
  asaasConfigured,
  asaasRejectedRequest,
  createPixSubscription,
  findOrCreateAsaasCustomer,
  getPixQr,
  listSubscriptionPayments,
} from "@/lib/asaas";
import { claimCheckout, reconcileClaimWithAsaas, recoverStaleCheckout, releaseUnsentCheckout } from "@/lib/checkout-claim";
import { checkoutDecision, openPixPayment } from "@/lib/checkout-safety";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { digitsOnly, isCpfCnpj } from "@/lib/document";
import { ensureSubscription, isBillingExempt } from "@/lib/plan";

export async function POST(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;
  if (isAdmin(auth.user) || isBillingExempt(auth.user)) {
    return NextResponse.json({ error: "Esta conta não tem cobrança." }, { status: 400 });
  }
  if (!asaasConfigured()) {
    return NextResponse.json({ error: "Asaas ainda não está configurado." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { document?: string } | null;
  if (!body || typeof body !== "object" || Array.isArray(body) || (body.document != null && typeof body.document !== "string")) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const document = digitsOnly(body.document || auth.company.document || "");
  if (!isCpfCnpj(document)) {
    return NextResponse.json({ error: "Informe um CPF ou CNPJ válido." }, { status: 400 });
  }

  const current = await ensureSubscription(auth.company.id);
  const row = (await recoverStaleCheckout(current)) ?? current;
  const decision = checkoutDecision(row, "PIX");
  if (decision === "blocked") return NextResponse.json({ error: "Já existe uma cobrança ou tentativa em andamento. Consulte o suporte." }, { status: 409 });
  const marker = decision === "create" ? await claimCheckout(auth.company.id, "PIX") : null;
  if (decision === "create" && !marker) return NextResponse.json({ error: "Já existe uma tentativa em andamento." }, { status: 409 });
  // prepare: nothing sent to Asaas yet · create: POST /subscriptions in flight · created: Asaas accepted it
  let stage: "prepare" | "create" | "created" = row.providerSubscriptionId ? "created" : "prepare";
  let customerId: string | null = null;
  try {
    await prisma.company.update({
      where: { id: auth.company.id },
      data: { document },
    });

    let subscriptionId = row.providerSubscriptionId;
    if (!subscriptionId) {
      const customer = await findOrCreateAsaasCustomer({
        name: auth.company.name,
        email: auth.company.email || auth.user.email || undefined,
        cpfCnpj: document,
        mobilePhone: digitsOnly(auth.company.whatsapp || auth.company.phone),
        companyId: auth.company.id,
      });
      await prisma.subscription.update({ where: { companyId: auth.company.id }, data: { providerCustomerId: customer.id } });
      customerId = customer.id;
      stage = "create";
      const created = await createPixSubscription(customer.id);
      stage = "created";
      subscriptionId = created.id;
      await prisma.subscription.update({ where: { companyId: auth.company.id }, data: { provider: "asaas", providerCustomerId: customer.id, providerSubscriptionId: subscriptionId, billingType: "PIX" } });
    }

    // Pick the open charge explicitly; the first listed payment may be an old, paid one.
    const payments = await listSubscriptionPayments(subscriptionId);
    const payment = openPixPayment(payments.items);
    if (!payment?.id) {
      return NextResponse.json({ error: "Não há cobrança Pix em aberto agora. Atualize a página em instantes." }, { status: 409 });
    }

    const qr = await getPixQr(payment.id);

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      payload: qr.payload ?? "",
      image: qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : "",
      expirationDate: qr.expirationDate ?? null,
    });
  } catch (error) {
    if (marker && stage === "prepare") {
      await releaseUnsentCheckout(auth.company.id, marker).catch(() => false);
      return NextResponse.json({ error: "Não foi possível gerar o Pix. Tente novamente." }, { status: 502 });
    }
    if (marker && stage === "create" && customerId && asaasRejectedRequest(error)) {
      // Asaas refused the create. Confirm nothing exists before unlocking a retry.
      const outcome = await reconcileClaimWithAsaas(auth.company.id, marker, customerId).catch(() => "kept" as const);
      if (outcome === "released") {
        return NextResponse.json({ error: "O Asaas recusou a cobrança. Confira o CPF/CNPJ e tente novamente." }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Não foi possível gerar o Pix. Consulte o suporte se já iniciou uma cobrança." }, { status: 502 });
  }
}
