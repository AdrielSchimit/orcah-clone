import { NextResponse } from "next/server";
import { findOrCreateCity } from "@/lib/city";
import { normalizeCompanyPagePatch } from "@/lib/company-page";
import { requireActivePlan } from "@/lib/plan";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { readMunicipios, resolveMunicipio, persistSelectedMunicipio } from "@/lib/municipios-server";

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
  if ("cityIbge" in body) {
    const municipality = resolveMunicipio(await readMunicipios(), body.cityIbge);
    if (!municipality) return NextResponse.json({ error: "Selecione uma cidade válida da lista." }, { status: 400 });
    const region = await persistSelectedMunicipio(prisma, municipality);
    if (!region) return NextResponse.json({ error: "Estado indisponível." }, { status: 400 });
    Object.assign(data, region, { servesRegion: false, serviceRadiusKm: null });
  }
  if (normalized.data.serviceCityIds?.length) {
    const count = await prisma.city.count({where:{id:{in:normalized.data.serviceCityIds}}});
    if (count !== normalized.data.serviceCityIds.length) return NextResponse.json({error:"Uma das cidades selecionadas não está disponível."},{status:400});
  }
  if ("serviceMunicipios" in body) {
    if (!Array.isArray(body.serviceMunicipios) || body.serviceMunicipios.length + (normalized.data.serviceCityIds?.length ?? 0) > 30) return NextResponse.json({ error: "Escolha até 30 cidades válidas." }, { status: 400 });
    const items = await readMunicipios();
    const municipalities = body.serviceMunicipios.map(ibge => resolveMunicipio(items, ibge));
    if (municipalities.some(city => !city)) return NextResponse.json({ error: "Cidade adicional inválida." }, { status: 400 });
    const ids = [...(normalized.data.serviceCityIds ?? [])];
    for (const municipality of municipalities) {
      if (!municipality) continue;
      const region = await persistSelectedMunicipio(prisma, municipality);
      if (!region) return NextResponse.json({ error: "Estado indisponível." }, { status: 400 });
      ids.push(region.cityId);
    }
    data.serviceCityIds = [...new Set(ids)];
    if (ids.length) { data.servesRegion = false; data.serviceRadiusKm = null; }
  }
  if (normalized.region && !("cityIbge" in body)) {
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
