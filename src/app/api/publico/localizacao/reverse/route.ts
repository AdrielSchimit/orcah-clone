import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatCitySearchParam } from "@/lib/provider-location";
import { slugify } from "@/lib/text";

type NominatimReverse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    "ISO3166-2-lvl4"?: string;
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("zoom", "10");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url, {
      headers: { "User-Agent": "Orcah/1.0 (provider search; contact@orcah.com.br)" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Não foi possível identificar a localização." }, { status: 502 });
    }

    const data = (await response.json()) as NominatimReverse;
    const cityName =
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.address?.municipality ??
      "";
    const stateName = data.address?.state ?? "";
    if (!cityName) {
      return NextResponse.json({ error: "Cidade não identificada." }, { status: 404 });
    }

    const ufFromIso = data.address?.["ISO3166-2-lvl4"]?.split("-")[1]?.toUpperCase();
    let state = ufFromIso
      ? await prisma.state.findUnique({ where: { uf: ufFromIso }, select: { id: true, uf: true, name: true } })
      : null;

    if (!state && stateName) {
      state = await prisma.state.findFirst({
        where: { name: { equals: stateName, mode: "insensitive" } },
        select: { id: true, uf: true, name: true },
      });
    }
    if (!state) {
      return NextResponse.json({ error: "Estado não encontrado no cadastro." }, { status: 404 });
    }

    const slug = slugify(cityName);
    let city = await prisma.city.findFirst({
      where: { stateId: state.id, slug },
      select: { id: true, name: true, slug: true },
    });
    if (!city) {
      city = await prisma.city.findFirst({
        where: { stateId: state.id, name: { equals: cityName, mode: "insensitive" } },
        select: { id: true, name: true, slug: true },
      });
    }
    if (!city) {
      return NextResponse.json(
        {
          error: "Cidade não encontrada no cadastro.",
          suggestion: `${cityName} - ${state.uf}`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      label: `${city.name} - ${state.uf}`,
      param: formatCitySearchParam(city, state),
      cityName: city.name,
      uf: state.uf,
    });
  } catch {
    return NextResponse.json({ error: "Falha ao usar localização." }, { status: 500 });
  }
}
