import { NextResponse } from "next/server";
import { findOrCreateCity } from "@/lib/city";
import { normalizeCompanyPagePatch } from "@/lib/company-page";
import { requireActivePlan } from "@/lib/plan";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;
  return NextResponse.json(auth.company);
}

/** Salva uma seção da página (só os campos enviados). A empresa vem sempre da sessão. */
export async function PATCH(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const normalized = normalizeCompanyPagePatch(body);
  if ("error" in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...normalized.data };
  if (normalized.region) {
    const state = await prisma.state.findUnique({ where: { id: normalized.region.stateId }, select: { id: true } });
    if (!state) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    const city = normalized.region.cityName ? await findOrCreateCity(state.id, normalized.region.cityName) : null;
    data.stateId = state.id;
    data.cityId = city?.id ?? null;
  }

  const company = await prisma.company.update({
    where: { id: auth.company.id },
    data,
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ ok: true, company });
}
