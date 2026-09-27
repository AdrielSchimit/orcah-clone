import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { publicServiceOrder, saveServiceByName, serializeService } from "@/lib/services";

export async function GET(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const all = new URL(request.url).searchParams.get("todos") === "1";
  const services = await prisma.service.findMany({
    where: { companyId: auth.company.id, ...(all ? {} : { active: true }) },
    orderBy: all ? publicServiceOrder : { name: "asc" },
    take: 200,
  });

  return NextResponse.json(services.map(serializeService));
}

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await saveServiceByName(prisma, auth.company.id, body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, created: result.created, service: serializeService(result.service) });
}
