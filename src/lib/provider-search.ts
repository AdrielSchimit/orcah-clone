import type { Prisma, PrismaClient } from "@prisma/client";
import { ramoLabel } from "@/lib/company-display";
import {
  companyServesSearchCity,
  formatCitySearchParam,
  resolveCityFreeText,
  resolveCitySearchParam,
  searchLocationLabel,
  type ResolvedSearchCity,
} from "@/lib/provider-location";
import { normalizeSearch } from "@/lib/text";

export type ProviderSort = "relevancia" | "nome";

export type SearchProvidersInput = {
  servico?: string;
  cidade?: string;
  cidadeTexto?: string;
  tipo?: "profissional" | "empresa" | "";
  ordenar?: ProviderSort;
};

export type ProviderListItem = {
  slug: string;
  name: string;
  category: string;
  place: string;
  servesSearchRegion: boolean;
  logoPath: string | null;
  coverPath: string | null;
  isCompany: boolean;
  hasReviews: false;
  rating: null;
  reviewCount: null;
  badge: "novo" | null;
};

export type SearchProvidersResult = {
  providers: ProviderListItem[];
  total: number;
  categorySlug: string | null;
  categoryLabel: string | null;
  categoryHeadline: string | null;
  locationLabel: string;
  cityParam: string | null;
  servicoParam: string | null;
  searchCity: ResolvedSearchCity | null;
};

type SearchDb = Pick<PrismaClient, "company" | "businessCategory" | "city" | "state">;

function categoryHeadlinePlural(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "Profissionais";
  if (/ista$/i.test(trimmed)) return `${trimmed}s`;
  if (/or$/i.test(trimmed)) return `${trimmed.slice(0, -2)}ores`;
  if (/eiro$/i.test(trimmed)) return `${trimmed.slice(0, -1)}s`;
  if (/ão$/i.test(trimmed)) return `${trimmed.slice(0, -2)}ões`;
  return `${trimmed}s`;
}

async function resolveCategory(db: SearchDb, servico: string) {
  const slug = servico.trim().toLowerCase();
  if (!slug) return null;

  const row = await db.businessCategory.findFirst({
    where: { active: true, slug },
    select: { id: true, name: true, slug: true, searchAliases: true },
  });
  if (row) return row;

  const q = normalizeSearch(slug);
  const rows = await db.businessCategory.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true, searchAliases: true },
  });
  return (
    rows.find((item) => {
      const aliases = Array.isArray(item.searchAliases) ? (item.searchAliases as string[]) : [];
      const haystack = [item.name, item.slug, ...aliases].map((part) => normalizeSearch(String(part))).join(" ");
      return haystack.includes(q);
    }) ?? null
  );
}

function pickCoverPath(company: {
  logoPath: string | null;
  photos: { path: string }[];
  services: { imagePath: string | null }[];
}) {
  if (company.photos[0]?.path) return company.photos[0].path;
  const serviceImage = company.services.find((service) => service.imagePath)?.imagePath;
  if (serviceImage) return serviceImage;
  return null;
}

function isCompanyProfile(company: { tradeName: string | null; name: string }) {
  const trade = company.tradeName?.trim();
  if (!trade) return false;
  return normalizeSearch(trade) !== normalizeSearch(company.name);
}

export async function searchPublicProviders(db: SearchDb, input: SearchProvidersInput): Promise<SearchProvidersResult> {
  const servicoParam = input.servico?.trim().toLowerCase() || null;
  const category = servicoParam ? await resolveCategory(db, servicoParam) : null;

  let searchCity: ResolvedSearchCity | null = null;
  let cityParam: string | null = input.cidade?.trim().toLowerCase() || null;

  if (cityParam) {
    searchCity = await resolveCitySearchParam(db, cityParam);
  }
  if (!searchCity && input.cidadeTexto?.trim()) {
    searchCity = await resolveCityFreeText(db, input.cidadeTexto);
    if (searchCity) {
      cityParam = formatCitySearchParam({ slug: searchCity.slug }, { uf: searchCity.uf });
    }
  }

  const where: Prisma.CompanyWhereInput = {
    user: { OR: [{ emailVerifiedAt: { not: null } }, { email: null }] },
  };

  if (category) {
    where.businessCategoryId = category.id;
  } else if (servicoParam) {
    where.OR = [
      { customRamoName: { contains: servicoParam, mode: "insensitive" } },
      { businessCategory: { slug: "outro" } },
    ];
  }

  if (searchCity) {
    where.stateId = searchCity.stateId;
  }

  const companies = await db.company.findMany({
    where,
    orderBy: [{ name: "asc" }],
    select: {
      slug: true,
      name: true,
      tradeName: true,
      logoPath: true,
      servesRegion: true,
      cityId: true,
      stateId: true,
      customRamoName: true,
      businessCategory: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
      state: { select: { name: true, uf: true } },
      photos: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { path: true },
      },
      services: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        take: 6,
        select: { imagePath: true },
      },
    },
    take: 120,
  });

  let filtered = companies.filter((company) => companyServesSearchCity(company, searchCity));

  if (input.tipo === "empresa") {
    filtered = filtered.filter((company) => isCompanyProfile(company));
  } else if (input.tipo === "profissional") {
    filtered = filtered.filter((company) => !isCompanyProfile(company));
  }

  if (input.ordenar === "nome") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  const providers: ProviderListItem[] = filtered.map((company) => {
    const place = company.city ? `${company.city.name} - ${company.state.uf}` : company.state.name;
    return {
      slug: company.slug,
      name: company.name,
      category: ramoLabel(company),
      place,
      servesSearchRegion: searchCity ? companyServesSearchCity(company, searchCity) : true,
      logoPath: company.logoPath,
      coverPath: pickCoverPath(company),
      isCompany: isCompanyProfile(company),
      hasReviews: false,
      rating: null,
      reviewCount: null,
      badge: "novo",
    };
  });

  const categoryLabel = category?.name ?? (servicoParam ? servicoParam : null);
  const categoryHeadline = categoryLabel ? categoryHeadlinePlural(categoryLabel) : null;

  return {
    providers,
    total: providers.length,
    categorySlug: category?.slug ?? servicoParam,
    categoryLabel,
    categoryHeadline,
    locationLabel: searchLocationLabel(searchCity),
    cityParam,
    servicoParam,
    searchCity,
  };
}

export async function getPublicProviderBrief(db: SearchDb, slug: string, searchCity: ResolvedSearchCity | null) {
  const company = await db.company.findFirst({
    where: { slug, user: { OR: [{ emailVerifiedAt: { not: null } }, { email: null }] } },
    select: {
      slug: true,
      name: true,
      tradeName: true,
      logoPath: true,
      servesRegion: true,
      cityId: true,
      stateId: true,
      customRamoName: true,
      businessCategory: { select: { name: true } },
      city: { select: { name: true } },
      state: { select: { name: true, uf: true } },
    },
  });
  if (!company) return null;
  if (searchCity && !companyServesSearchCity(company, searchCity)) return null;

  const place = company.city ? `${company.city.name} - ${company.state.uf}` : company.state.name;
  return {
    slug: company.slug,
    name: company.name,
    category: ramoLabel(company),
    place,
    servesSearchRegion: searchCity ? companyServesSearchCity(company, searchCity) : true,
    logoPath: company.logoPath,
    isCompany: isCompanyProfile(company),
  };
}
