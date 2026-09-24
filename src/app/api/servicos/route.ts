import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { moneyString, parseMoney } from "@/lib/money";

function serializeService(service: {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  defaultPrice: { toString(): string } | number;
}) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    unit: service.unit,
    defaultPrice: moneyString(Number(service.defaultPrice)),
  };
}

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const services = await prisma.service.findMany({
    where: { companyId: auth.company.id, active: true },
    orderBy: { name: "asc" },
    take: 80,
  });

  return NextResponse.json(services.map(serializeService));
}

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    name?: string;
    unit?: string;
    defaultPrice?: string | number;
    description?: string | null;
  };

  const name = body.name?.trim() ?? "";
  const unit = body.unit?.trim() || "un";
  const defaultPrice = parseMoney(body.defaultPrice);
  const description = body.description?.trim() || null;

  if (name.length < 2) {
    return NextResponse.json({ error: "Informe o nome do serviço." }, { status: 400 });
  }

  const existing = await prisma.service.findFirst({
    where: { companyId: auth.company.id, name },
  });

  const service = existing
    ? await prisma.service.update({
        where: { id: existing.id },
        data: { unit, defaultPrice: moneyString(defaultPrice), description, active: true },
      })
    : await prisma.service.create({
        data: {
          companyId: auth.company.id,
          name,
          unit,
          defaultPrice: moneyString(defaultPrice),
          description,
          active: true,
        },
      });

  return NextResponse.json({ ok: true, service: serializeService(service) });
}
