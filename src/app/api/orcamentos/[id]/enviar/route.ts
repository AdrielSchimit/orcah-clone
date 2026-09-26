import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { recordBudgetEvent } from "@/lib/public-budget";
import { budgetPublicUrl, whatsappHref, whatsappBudgetMessage } from "@/lib/whatsapp";
import { companyTemplate, parseExtras } from "@/lib/templates";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  const budget = await prisma.budget.findFirst({
    where: { id, companyId: auth.company.id },
    include: {
      customer: true,
      serviceCity: { select: { name: true } },
      company: { include: { businessCategory: true } },
    },
  });
  if (!budget) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  const template = companyTemplate(budget.company);
  const phone = budget.customer.whatsapp || budget.customer.phone;
  const url = budgetPublicUrl(budget.publicToken);
  const message = whatsappBudgetMessage({
    customerName: budget.customer.name,
    number: budget.number,
    totalLabel: formatBRL(Number(budget.total)),
    url,
    templateKey: template.key,
    address: budget.serviceAddress,
    city: budget.serviceCity?.name,
    days: budget.estimatedDays,
    extras: parseExtras(budget.extras),
  });
  const href = whatsappHref(phone, message);
  if (!href) {
    return NextResponse.json({ error: "Cliente sem telefone para WhatsApp." }, { status: 400 });
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
  return NextResponse.json({ ok: true, href, url, status });
}
