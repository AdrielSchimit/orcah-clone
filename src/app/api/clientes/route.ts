import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/company";
import { requireActivePlan } from "@/lib/plan";
import { parseCustomerInput, type CustomerInput } from "@/lib/crm";

export async function GET(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const digits = q.replace(/\D/g, "");

  const customers = await prisma.customer.findMany({
    where: {
      companyId: auth.company.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              ...(digits ? [{ phone: { contains: digits } }] : []),
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 40,
    select: {
      id: true,
      name: true,
      phone: true,
      whatsapp: true,
      email: true,
      address: true,
      neighborhood: true,
      cityId: true,
      stateId: true,
      city: { select: { name: true } },
      state: { select: { uf: true } },
    },
  });

  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

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

  const customer = await prisma.customer.create({
    data: {
      ...parsed.data,
      companyId: auth.company.id,
      firstContactAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, customer });
}
