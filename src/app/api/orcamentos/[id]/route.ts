import { NextResponse } from "next/server";
import { parseBudgetItems, budgetTotals, type ItemInput } from "@/lib/budget";
import { extrasJson, mapItemCreates, serializeBudget } from "@/lib/budget-serialize";
import type { CommercialInput } from "@/lib/commercial";
import { requireCompany } from "@/lib/company";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { moneyString, parseMoney } from "@/lib/money";
import { parseExtras } from "@/lib/templates";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  const budget = await prisma.budget.findFirst({
    where: { id, companyId: auth.company.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      serviceCity: { select: { name: true } },
      serviceState: { select: { uf: true } },
    },
  });

  if (!budget) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    ...serializeBudget(budget),
    items: budget.items.map((item) => ({
      ...item,
      quantity: moneyString(Number(item.quantity)),
      unitPrice: moneyString(Number(item.unitPrice)),
      discount: moneyString(Number(item.discount)),
      subtotal: moneyString(Number(item.subtotal)),
    })),
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  const existing = await prisma.budget.findFirst({
    where: { id, companyId: auth.company.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }
  if (existing.status !== "draft" && existing.status !== "waiting") {
    return NextResponse.json({ error: "Só rascunho ou pedido de alteração pode ser editado." }, { status: 409 });
  }

  const body = (await request.json()) as {
    customerId?: number | string;
    serviceStateId?: number | string;
    serviceCityId?: number | string;
    validityDate?: string;
    estimatedDays?: number | string;
    serviceAddress?: string;
    notes?: string;
    discount?: string | number;
    discountType?: string;
    discountValue?: string | number;
    paymentMethod?: string;
    acceptedPaymentMethods?: string[];
    paymentCondition?: string;
    downPaymentType?: string;
    downPaymentValue?: string | number;
    extras?: unknown;
    items?: ItemInput[];
  };

  const customerId = Number(body.customerId);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId: auth.company.id },
  });
  if (!customer) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 400 });
  }

  const serviceStateId = body.serviceStateId ? Number(body.serviceStateId) : existing.serviceStateId;
  const serviceCityId = body.serviceCityId ? Number(body.serviceCityId) : existing.serviceCityId;
  if (serviceCityId && serviceStateId) {
    const city = await prisma.city.findFirst({
      where: { id: serviceCityId, stateId: serviceStateId },
    });
    if (!city) {
      return NextResponse.json({ error: "Cidade do serviço inválida." }, { status: 400 });
    }
  }

  const items = parseBudgetItems(body.items);
  if (items.length === 0) {
    return NextResponse.json({ error: "Inclua pelo menos um item." }, { status: 400 });
  }

  const extras = parseExtras(body.extras);
  const commercialInput: CommercialInput = {
    discountType: body.discountType ?? "amount",
    discountValue: body.discountValue ?? body.discount,
    paymentMethod: body.paymentMethod,
    acceptedPaymentMethods: body.acceptedPaymentMethods,
    paymentCondition: body.paymentCondition,
    downPaymentType: body.downPaymentType,
    downPaymentValue: body.downPaymentValue,
  };
  const totals = budgetTotals(
    items.reduce((sum, item) => sum + item.subtotal, 0),
    parseMoney(body.discount),
    extras,
    commercialInput,
  );
  if ("error" in totals) {
    return NextResponse.json({ error: totals.error }, { status: 400 });
  }
  const { subtotal, discount, total, commercial } = totals;
  const validityDate = body.validityDate ? new Date(`${body.validityDate}T12:00:00`) : null;
  const estimatedDays = body.estimatedDays ? Number(body.estimatedDays) : null;

  const budget = await prisma.$transaction(async (tx) => {
    await tx.budgetItem.deleteMany({ where: { budgetId: existing.id } });
    return tx.budget.update({
      where: { id: existing.id },
      data: {
        customerId: customer.id,
        serviceStateId,
        serviceCityId,
        subtotal: moneyString(subtotal),
        discount: moneyString(discount),
        discountType: commercial.discountType,
        discountValue: moneyString(commercial.discountValue),
        total: moneyString(total),
        paymentMethod: commercial.paymentMethod,
        acceptedPaymentMethods: commercial.acceptedPaymentMethods,
        paymentCondition: commercial.paymentCondition,
        downPaymentType: commercial.downPaymentType,
        downPaymentValue: moneyString(commercial.downPaymentValue),
        downPaymentAmount: moneyString(commercial.downPaymentAmount),
        validityDate,
        estimatedDays: Number.isFinite(estimatedDays) ? estimatedDays : null,
        serviceAddress: body.serviceAddress?.trim() || null,
        notes: body.notes?.trim() || null,
        extras: extrasJson(body.extras),
        items: { create: mapItemCreates(items) },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
  });

  return NextResponse.json({ ok: true, budget: serializeBudget(budget) });
}
