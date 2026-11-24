import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { asaasConfigured, asaasRejectedRequest, clientIp, createCardSubscription, findOrCreateAsaasCustomer } from "@/lib/asaas";
import { claimCheckout, reconcileClaimWithAsaas, recoverStaleCheckout, releaseUnsentCheckout } from "@/lib/checkout-claim";
import { cardDetailsValid, checkoutDecision } from "@/lib/checkout-safety";
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

  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.values(raw).some(value => typeof value !== "string" && value != null)) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const body = raw as {
    document?: string;
    holderName?: string;
    number?: string;
    expiry?: string;
    ccv?: string;
    postalCode?: string;
    addressNumber?: string;
  };

  const document = digitsOnly(body.document || auth.company.document || "");
  const holderName = body.holderName?.trim() ?? "";
  const number = digitsOnly(body.number ?? "");
  const expiry = digitsOnly(body.expiry ?? "");
  const ccv = digitsOnly(body.ccv ?? "");
  const postalCode = digitsOnly(body.postalCode || auth.company.zipCode || "");
  const addressNumber = (body.addressNumber ?? "").trim() || "0";

  if (!isCpfCnpj(document)) {
    return NextResponse.json({ error: "Informe um CPF ou CNPJ válido." }, { status: 400 });
  }
  if (holderName.length < 3 || !cardDetailsValid(number, expiry, ccv)) {
    return NextResponse.json({ error: "Confira os dados do cartão." }, { status: 400 });
  }
  if (postalCode.length !== 8) {
    return NextResponse.json({ error: "Informe o CEP do dono do cartão." }, { status: 400 });
  }

  const expiryMonth = expiry.slice(0, 2);
  const expiryYear = expiry.length === 4 ? `20${expiry.slice(2)}` : expiry.slice(2);
  const phone = digitsOnly(auth.company.whatsapp || auth.company.phone);
  const billingEmail = auth.company.email || auth.user.email;
  if (!billingEmail) {
    return NextResponse.json({ error: "Informe um e-mail nos dados da sua página para pagar com cartão." }, { status: 400 });
  }

  const current = await ensureSubscription(auth.company.id);
  const row = (await recoverStaleCheckout(current)) ?? current;
  const decision = checkoutDecision(row, "CREDIT_CARD");
  if (decision === "reuse") return NextResponse.json({ ok: true, pending: true });
  if (decision === "blocked") return NextResponse.json({ error: "Já existe uma cobrança ou tentativa em andamento. Consulte o suporte antes de tentar novamente." }, { status: 409 });
  const marker = await claimCheckout(auth.company.id, "CREDIT_CARD");
  if (!marker) return NextResponse.json({ error: "Já existe uma tentativa em andamento." }, { status: 409 });
  // prepare: nothing sent to Asaas yet · create: POST /subscriptions in flight · created: Asaas accepted it
  let stage: "prepare" | "create" | "created" = "prepare";
  let customerId: string | null = null;
  try {
    await prisma.company.update({
      where: { id: auth.company.id },
      data: { document, zipCode: postalCode },
    });

    const customer = await findOrCreateAsaasCustomer({
      name: auth.company.name,
      email: billingEmail,
      cpfCnpj: document,
      mobilePhone: phone,
      companyId: auth.company.id,
    });

    await prisma.subscription.update({ where: { companyId: auth.company.id }, data: { providerCustomerId: customer.id } });
    customerId = customer.id;
    stage = "create";
    const created = await createCardSubscription({
      customerId: customer.id,
      remoteIp: clientIp(request),
      creditCard: {
        holderName,
        number,
        expiryMonth,
        expiryYear,
        ccv,
      },
      holder: {
        name: holderName,
        email: billingEmail,
        cpfCnpj: document,
        postalCode,
        addressNumber,
        phone,
        mobilePhone: phone,
      },
    });
    stage = "created";

    await prisma.subscription.update({
      where: { companyId: auth.company.id },
      data: { provider: "asaas", providerCustomerId: customer.id, providerSubscriptionId: created.id, billingType: "CREDIT_CARD" },
    });
    return NextResponse.json({ ok: true, pending: true });
  } catch (error) {
    if (stage === "prepare") {
      await releaseUnsentCheckout(auth.company.id, marker).catch(() => false);
      return NextResponse.json({ error: "Não foi possível iniciar a cobrança. Tente novamente." }, { status: 502 });
    }
    if (stage === "create" && customerId && asaasRejectedRequest(error)) {
      // Asaas answered with a refusal (e.g. card declined). Confirm nothing was created before unlocking a retry.
      const outcome = await reconcileClaimWithAsaas(auth.company.id, marker, customerId).catch(() => "kept" as const);
      if (outcome === "released") {
        return NextResponse.json({ error: "O cartão não foi aprovado. Confira os dados ou use outro cartão." }, { status: 402 });
      }
      if (outcome === "adopted") return NextResponse.json({ ok: true, pending: true });
    }
    return NextResponse.json({ error: "Não foi possível confirmar a criação da cobrança. Consulte o suporte antes de repetir." }, { status: 502 });
  }
}
