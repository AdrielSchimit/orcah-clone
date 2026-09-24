import { NextResponse } from "next/server";
import { isPreviewAdmin } from "@/lib/admin";
import {
  asaasConfigured,
  createPixSubscription,
  findOrCreateAsaasCustomer,
  firstSubscriptionPayment,
  getPixQr,
} from "@/lib/asaas";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { digitsOnly, isCpfCnpj } from "@/lib/document";
import { ensureSubscription } from "@/lib/plan";

export async function POST(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;
  if (isPreviewAdmin(auth.user)) {
    return NextResponse.json({ error: "Esta conta não tem cobrança." }, { status: 400 });
  }
  if (!asaasConfigured()) {
    return NextResponse.json({ error: "Asaas ainda não está configurado." }, { status: 503 });
  }

  const body = (await request.json()) as { document?: string };
  const document = digitsOnly(body.document || auth.company.document || "");
  if (!isCpfCnpj(document)) {
    return NextResponse.json({ error: "Informe um CPF ou CNPJ válido." }, { status: 400 });
  }

  await ensureSubscription(auth.company.id);
  await prisma.company.update({
    where: { id: auth.company.id },
    data: { document },
  });

  try {
    const customer = await findOrCreateAsaasCustomer({
      name: auth.company.name,
      email: auth.company.email || auth.user.email,
      cpfCnpj: document,
      mobilePhone: digitsOnly(auth.company.whatsapp || auth.company.phone),
      companyId: auth.company.id,
    });

    const row = await prisma.subscription.findUnique({ where: { companyId: auth.company.id } });
    let subscriptionId = row?.providerSubscriptionId;
    if (!subscriptionId || row?.billingType !== "PIX") {
      const created = await createPixSubscription(customer.id);
      subscriptionId = created.id;
    }

    const payment = await firstSubscriptionPayment(subscriptionId);
    if (!payment?.id) {
      return NextResponse.json({ error: "Cobrança Pix ainda não apareceu. Tente de novo." }, { status: 502 });
    }

    const qr = await getPixQr(payment.id);
    await prisma.subscription.update({
      where: { companyId: auth.company.id },
      data: {
        provider: "asaas",
        providerCustomerId: customer.id,
        providerSubscriptionId: subscriptionId,
        providerPaymentId: payment.id,
        billingType: "PIX",
      },
    });

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      payload: qr.payload ?? "",
      image: qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : "",
      expirationDate: qr.expirationDate ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gerar o Pix.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
