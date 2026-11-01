import { NextResponse } from "next/server";
import { parseId } from "@/lib/crm";
import { prisma } from "@/lib/db";
import { requireActivePlan } from "@/lib/plan";
import { parseSupplierInput } from "@/lib/product-quote";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = parseId((await context.params).id);
  const parsed = parseSupplierInput(await request.json().catch(() => ({})));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = id
    ? await prisma.supplier.updateMany({ where: { id, companyId: auth.company.id, active: true }, data: parsed.data })
    : { count: 0 };
  if (!updated.count) {
    return NextResponse.json({ error: "Vendedor não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// Só desativa: as cotações antigas continuam mostrando quem respondeu.
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = parseId((await context.params).id);
  const updated = id
    ? await prisma.supplier.updateMany({ where: { id, companyId: auth.company.id }, data: { active: false } })
    : { count: 0 };
  if (!updated.count) {
    return NextResponse.json({ error: "Vendedor não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
