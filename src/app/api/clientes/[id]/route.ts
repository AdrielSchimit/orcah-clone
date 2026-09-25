import { NextResponse } from "next/server";
import { parseCustomerInput, parseId, updateCompanyCustomer, type CustomerInput } from "@/lib/crm";
import { prisma } from "@/lib/db";
import { requireActivePlan } from "@/lib/plan";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = parseId((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const parsed = parseCustomerInput((await request.json()) as CustomerInput);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { stateId, cityId } = parsed.data;
  if (cityId && stateId) {
    const city = await prisma.city.findFirst({ where: { id: cityId, stateId } });
    if (!city) {
      return NextResponse.json({ error: "Cidade inválida." }, { status: 400 });
    }
  }

  const updated = await updateCompanyCustomer(prisma, auth.company.id, id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, customer: { id } });
}
