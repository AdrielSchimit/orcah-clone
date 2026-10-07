import type { PrismaClient } from "@prisma/client";
import { normalizeSearch, slugify } from "@/lib/text";

export type ResolvedSearchCity = {
  id: number;
  name: string;
  slug: string;
  stateId: number;
  stateName: string;
  uf: string;
};

/** Formato de URL: `maravilha-sc` (slug da cidade + UF). */
export function formatCitySearchParam(city: { slug: string }, state: { uf: string }) {
  return `${city.slug}-${state.uf.toLowerCase()}`;
}

export function parseCitySearchParam(raw: string) {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  const match = trimmed.match(/^(.+)-([a-z]{2})$/);
  if (!match) return null;
  return { citySlug: match[1], uf: match[2].toUpperCase() };
}

export async function resolveCitySearchParam(db: Pick<PrismaClient, "city" | "state">, param: string) {
  const parsed = parseCitySearchParam(param);
  if (!parsed) return null;

  const state = await db.state.findUnique({
    where: { uf: parsed.uf },
    select: { id: true, name: true, uf: true },
  });
  if (!state) return null;

  const city = await db.city.findUnique({
    where: { stateId_slug: { stateId: state.id, slug: parsed.citySlug } },
    select: { id: true, name: true, slug: true, stateId: true },
  });
  if (!city) return null;

  return {
    id: city.id,
    name: city.name,
    slug: city.slug,
    stateId: state.id,
    stateName: state.name,
    uf: state.uf,
  } satisfies ResolvedSearchCity;
}

/** Interpreta texto livre tipo "Maravilha - SC" ou "Maravilha, SC". */
export async function resolveCityFreeText(db: Pick<PrismaClient, "city" | "state">, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const param = parseCitySearchParam(trimmed.replace(/\s+/g, "-").replace(/,/g, "-"));
  if (param) {
    const fromParam = await resolveCitySearchParam(db, `${param.citySlug}-${param.uf.toLowerCase()}`);
    if (fromParam) return fromParam;
  }

  const parts = trimmed.split(/[-–,]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const ufCandidate = parts[parts.length - 1];
    if (/^[a-zA-Z]{2}$/.test(ufCandidate)) {
      const cityName = parts.slice(0, -1).join(" ");
      const state = await db.state.findUnique({
        where: { uf: ufCandidate.toUpperCase() },
        select: { id: true, name: true, uf: true },
      });
      if (state) {
        const slug = slugify(cityName);
        const city = await db.city.findFirst({
          where: { stateId: state.id, slug },
          select: { id: true, name: true, slug: true, stateId: true },
        });
        if (city) {
          return {
            id: city.id,
            name: city.name,
            slug: city.slug,
            stateId: state.id,
            stateName: state.name,
            uf: state.uf,
          } satisfies ResolvedSearchCity;
        }
      }
    }
  }

  const needle = normalizeSearch(trimmed);
  const cities = await db.city.findMany({
    where: {
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { slug: { contains: slugify(trimmed) } },
      ],
    },
    take: 30,
    select: {
      id: true,
      name: true,
      slug: true,
      stateId: true,
      state: { select: { name: true, uf: true } },
    },
  });

  const exact = cities.find((city) => normalizeSearch(`${city.name}-${city.state.uf}`) === needle);
  const pick = exact ?? cities.find((city) => normalizeSearch(city.name) === needle) ?? cities[0];
  if (!pick) return null;

  return {
    id: pick.id,
    name: pick.name,
    slug: pick.slug,
    stateId: pick.stateId,
    stateName: pick.state.name,
    uf: pick.state.uf,
  } satisfies ResolvedSearchCity;
}

export function companyServesSearchCity(
  company: { cityId: number | null; stateId: number; servesRegion: boolean; serviceCityIds?: number[] },
  searchCity: ResolvedSearchCity | null,
) {
  if (!searchCity) return true;
  if (company.cityId === searchCity.id || company.serviceCityIds?.includes(searchCity.id)) return true;
  if (company.servesRegion && company.stateId === searchCity.stateId) return true;
  return false;
}

export function searchLocationLabel(city: ResolvedSearchCity | null) {
  if (!city) return "";
  return `${city.name} - ${city.uf}`;
}
