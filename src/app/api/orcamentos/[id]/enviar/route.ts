import { NextResponse } from "next/server";
import { isRepublishMetadata } from "@/lib/budget-cycle";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { recordBudgetEvent } from "@/lib/public-budget";
import { budgetPublicUrl, whatsappHref, whatsappBudgetMessage, whatsappPhoneError } from "@/lib/whatsapp";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  const budget = await prisma.budget.findFirst({
    where: { id, companyId: auth.company.id },
    include: { customer: true },
  });
  if (!budget) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  const phone = budget.customer.whatsapp || budget.customer.phone;
  const url = budgetPublicUrl(budget.publicToken);
  const lastEvent = await prisma.budgetEvent.findFirst({
    where: { budgetId: budget.id },
    orderBy: { createdAt: "desc" },
    select: { event: true, metadata: true },
  });
  const republished =
    budget.status === "sent" && lastEvent?.event === "sent" && isRepublishMetadata(lastEvent.metadata);
  const message = whatsappBudgetMessage({
    customerName: budget.customer.name,
    number: budget.number,
    totalLabel: formatBRL(Number(budget.total)),
    url,
    status: budget.status,
    republished,
  });
  const phoneError = whatsappPhoneError(phone);
  if (phoneError) {
    return NextResponse.json({ error: phoneError, url, message }, { status: 400 });
  }
  const href = whatsappHref(phone, message);
  if (!href) {
    return NextResponse.json({ error: phoneError || "Não consegui abrir o WhatsApp.", url, message }, { status: 400 });
  }

  if (budget.status === "draft") {
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: "sent", sentAt: new Date() },
    });
    await recordBudgetEvent(request, budget.id, "sent");
  } else if (budget.status === "waiting") {
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: "sent" },
    });
    await recordBudgetEvent(request, budget.id, "sent", { republished: true });
  }

  const status = budget.status === "draft" || budget.status === "waiting" ? "sent" : budget.status;
  return NextResponse.json({ ok: true, href, url, message, status });
}
