import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { asaasConfigured, clientIp, createCardSubscription, findOrCreateAsaasCustomer } from "@/lib/asaas";
import { cardCheckoutAlreadyStarted } from "@/lib/asaas-checkout";
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

  const body = (await request.json()) as {
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
  if (holderName.length < 3 || number.length < 13 || expiry.length < 4 || ccv.length < 3) {
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

  await ensureSubscription(auth.company.id);
  // Avoid another recurring charge after a timeout, refresh or repeated click.
  const current = await prisma.subscription.findUnique({ where: { companyId: auth.company.id } });
  if (cardCheckoutAlreadyStarted(current)) {
    return NextResponse.json({ ok: true, paid: false, pending: true });
  }

  await prisma.company.update({
    where: { id: auth.company.id },
    data: { document, zipCode: postalCode },
  });

  try {
    const customer = await findOrCreateAsaasCustomer({
      name: auth.company.name,
      email: billingEmail,
      cpfCnpj: document,
      mobilePhone: phone,
      companyId: auth.company.id,
    });

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

    // Creating a subscription is NOT payment confirmation.
    // Preserve the existing trial/expired state until a verified webhook arrives.
    await prisma.subscription.update({
      where: { companyId: auth.company.id },
      data: {
        provider: "asaas",
        providerCustomerId: customer.id,
        providerSubscriptionId: created.id,
        providerPaymentId: null,
        billingType: "CREDIT_CARD",
      },
    });

    return NextResponse.json({ ok: true, paid: false, pending: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível concluir a solicitação. Verifique o status antes de tentar novamente." },
      { status: 502 },
    );
  }
}
