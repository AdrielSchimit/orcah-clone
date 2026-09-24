import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/company";
import { requireActivePlan } from "@/lib/plan";

export async function GET(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: {
      companyId: auth.company.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q.replace(/\D/g, "") } },
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

  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    neighborhood?: string;
    notes?: string;
    stateId?: number | string;
    cityId?: number | string;
  };

  const name = body.name?.trim() ?? "";
  const phone = body.phone?.replace(/\D/g, "") ?? "";
  const whatsapp = body.whatsapp?.replace(/\D/g, "") || phone;
  const email = body.email?.trim().toLowerCase() || null;
  const stateId = body.stateId ? Number(body.stateId) : null;
  const cityId = body.cityId ? Number(body.cityId) : null;

  if (name.length < 2) {
    return NextResponse.json({ error: "Informe o nome do cliente." }, { status: 400 });
  }
  if (phone.length < 8) {
    return NextResponse.json({ error: "Informe o telefone do cliente." }, { status: 400 });
  }
  if ((stateId && !cityId) || (cityId && !stateId)) {
    return NextResponse.json({ error: "Escolha estado e cidade juntos." }, { status: 400 });
  }
  if (cityId && stateId) {
    const city = await prisma.city.findFirst({ where: { id: cityId, stateId } });
    if (!city) {
      return NextResponse.json({ error: "Cidade inválida." }, { status: 400 });
    }
  }

  const customer = await prisma.customer.create({
    data: {
      companyId: auth.company.id,
      name,
      phone,
      whatsapp,
      email,
      address: body.address?.trim() || null,
      neighborhood: body.neighborhood?.trim() || null,
      notes: body.notes?.trim() || null,
      stateId,
      cityId,
      firstContactAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, customer });
}
