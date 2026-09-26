import type { PrismaClient } from "@prisma/client";
import { ramoLabel } from "@/lib/company-display";

/**
 * Dados da página pública por slug. Sai daqui só o que pode aparecer para qualquer
 * visitante: nada de documento, e-mail, endereço, usuário, plano ou preço escondido.
 */

export type PublicPageDb = Pick<PrismaClient, "company">;

export function normalizeHexColor(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex.slice(1).split("").map((c) => c + c).join("")}`.toLowerCase();
  }
  return null;
}

/** Texto claro ou escuro, o que tiver mais contraste com o fundo. */
export function readableTextColor(background: string) {
  const hex = normalizeHexColor(background) ?? "#151f38";
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.45 ? "#151f38" : "#ffffff";
}

export async function getPublicCompanyPage(db: PublicPageDb, slug: string) {
  if (!slug || slug.length > 160) return null;
  const company = await db.company.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      phone: true,
      whatsapp: true,
      instagram: true,
      facebook: true,
      website: true,
      openingHours: true,
      primaryColor: true,
      secondaryColor: true,
      logoPath: true,
      servesRegion: true,
      customRamoName: true,
      businessCategory: { select: { name: true } },
      city: { select: { name: true } },
      state: { select: { name: true, uf: true } },
      photos: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, path: true, title: true },
        take: 24,
      },
      services: {
        where: { active: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          imagePath: true,
          featured: true,
          showPrice: true,
          defaultPrice: true,
          unit: true,
        },
        take: 60,
      },
    },
  });
  if (!company) return null;

  const place = company.city ? `${company.city.name} - ${company.state.uf}` : company.state.name;

  return {
    slug: company.slug,
    name: company.name,
    description: company.description?.trim() || null,
    ramo: ramoLabel(company),
    place,
    areaLabel: company.servesRegion ? `${place} e região` : place,
    whatsapp: company.whatsapp || company.phone || null,
    phone: company.phone || null,
    instagram: company.instagram || null,
    facebook: company.facebook || null,
    website: company.website || null,
    openingHours: company.openingHours || null,
    logoPath: company.logoPath || null,
    primaryColor: normalizeHexColor(company.primaryColor),
    secondaryColor: normalizeHexColor(company.secondaryColor),
    photos: company.photos,
    services: company.services.map((service) => {
      const price = Number(service.defaultPrice);
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        imagePath: service.imagePath,
        featured: service.featured,
        unit: service.unit,
        // preço só sai do servidor se o prestador escolheu mostrar
        price: service.showPrice && price > 0 ? price : null,
      };
    }),
  };
}

export type PublicCompanyPage = NonNullable<Awaited<ReturnType<typeof getPublicCompanyPage>>>;
