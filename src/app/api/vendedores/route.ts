import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/company";
import { requireActivePlan } from "@/lib/plan";
import { parseSupplierInput } from "@/lib/product-quote";

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const suppliers = await prisma.supplier.findMany({
    where: { companyId: auth.company.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, store: true, whatsapp: true },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const parsed = parseSupplierInput(await request.json().catch(() => ({})));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: { ...parsed.data, companyId: auth.company.id },
    select: { id: true, name: true, store: true, whatsapp: true },
  });
  return NextResponse.json({ ok: true, supplier });
}
