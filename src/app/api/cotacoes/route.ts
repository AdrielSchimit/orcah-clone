import { NextResponse } from "next/server";
import { createPublicToken } from "@/lib/budget";
import { prisma } from "@/lib/db";
import { requireActivePlan } from "@/lib/plan";
import { parseIdList, parseQuoteItems } from "@/lib/product-quote";

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { items?: unknown; supplierIds?: unknown };
  const items = parseQuoteItems(body.items);
  if ("error" in items) {
    return NextResponse.json({ error: items.error }, { status: 400 });
  }
  const supplierIds = parseIdList(body.supplierIds);
  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds }, companyId: auth.company.id, active: true },
    select: { id: true },
  });
  if (!suppliers.length) {
    return NextResponse.json({ error: "Escolha pelo menos um vendedor." }, { status: 400 });
  }

  const quote = await prisma.productQuote.create({
    data: {
      companyId: auth.company.id,
      items: { create: items.data.map((item, position) => ({ ...item, position })) },
      suppliers: { create: suppliers.map((supplier) => ({ supplierId: supplier.id, publicToken: createPublicToken() })) },
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: quote.id });
}
