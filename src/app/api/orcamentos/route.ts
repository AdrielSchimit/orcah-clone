import { NextResponse } from "next/server";
import { createPublicToken, nextBudgetNumber, parseBudgetItems, budgetTotals } from "@/lib/budget";
import { extrasJson, mapItemCreates, serializeBudget } from "@/lib/budget-serialize";
import { requireCompany } from "@/lib/company";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { moneyString, parseMoney } from "@/lib/money";
import type { ItemInput } from "@/lib/budget";
import { parseExtras } from "@/lib/templates";

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const budgets = await prisma.budget.findMany({
    where: { companyId: auth.company.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      serviceCity: { select: { name: true } },
      serviceState: { select: { uf: true } },
    },
  });

  return NextResponse.json(budgets.map(serializeBudget));
}

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    customerId?: number | string;
    serviceStateId?: number | string;
    serviceCityId?: number | string;
    validityDate?: string;
    estimatedDays?: number | string;
    serviceAddress?: string;
    notes?: string;
    discount?: string | number;
    extras?: unknown;
    items?: ItemInput[];
  };

  const customerId = Number(body.customerId);
  if (!customerId) {
    return NextResponse.json({ error: "Escolha um cliente." }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId: auth.company.id },
  });
  if (!customer) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 400 });
  }

  const serviceStateId = body.serviceStateId ? Number(body.serviceStateId) : auth.company.stateId;
  const serviceCityId = body.serviceCityId ? Number(body.serviceCityId) : auth.company.cityId;
  let cityId: number | null = null;
  if (serviceCityId) {
    const city = await prisma.city.findFirst({
      where: { id: serviceCityId, stateId: serviceStateId },
    });
    if (!city) {
      return NextResponse.json({ error: "Cidade do serviço inválida." }, { status: 400 });
    }
    cityId = city.id;
  }

  const items = parseBudgetItems(body.items);
  if (items.length === 0) {
    return NextResponse.json({ error: "Inclua pelo menos um item." }, { status: 400 });
  }

  const extras = parseExtras(body.extras);
  const totals = budgetTotals(
    items.reduce((sum, item) => sum + item.subtotal, 0),
    parseMoney(body.discount),
    extras,
  );
  if ("error" in totals) {
    return NextResponse.json({ error: totals.error }, { status: 400 });
  }
  const { subtotal, discount, total } = totals;

  let publicToken = createPublicToken();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await prisma.budget.findUnique({ where: { publicToken } });
    if (!taken) break;
    publicToken = createPublicToken();
  }

  const number = await nextBudgetNumber(auth.company.id);
  const validityDate = body.validityDate ? new Date(`${body.validityDate}T12:00:00`) : null;
  const estimatedDays = body.estimatedDays ? Number(body.estimatedDays) : null;

  const budget = await prisma.budget.create({
    data: {
      companyId: auth.company.id,
      customerId: customer.id,
      serviceStateId,
      serviceCityId: cityId,
      number,
      publicToken,
      status: "draft",
      subtotal: moneyString(subtotal),
      discount: moneyString(discount),
      total: moneyString(total),
      validityDate,
      estimatedDays: Number.isFinite(estimatedDays) ? estimatedDays : null,
      serviceAddress: body.serviceAddress?.trim() || null,
      notes: body.notes?.trim() || null,
      extras: extrasJson(body.extras),
      items: { create: mapItemCreates(items) },
      events: { create: { event: "created" } },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json({ ok: true, budget: serializeBudget(budget) });
}
