import { NextResponse } from "next/server";
import { serviceAreaLabel } from "@/lib/company-display";
import { prisma } from "@/lib/db";
import { getPublicCompanyPage } from "@/lib/public-page";
import { resolveCitySearchParam, searchLocationLabel } from "@/lib/provider-location";
import { getPublicProviderBrief } from "@/lib/provider-search";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const slug = (await context.params).slug;
  const { searchParams } = new URL(request.url);
  const cidade = searchParams.get("cidade") ?? "";

  const searchCity = cidade ? await resolveCitySearchParam(prisma, cidade) : null;
  const brief = await getPublicProviderBrief(prisma, slug, searchCity);
  if (!brief) {
    return NextResponse.json({ error: "Prestador não encontrado." }, { status: 404 });
  }

  const page = await getPublicCompanyPage(prisma, slug);
  if (!page) {
    return NextResponse.json({ error: "Prestador não encontrado." }, { status: 404 });
  }

  const company = await prisma.company.findUnique({
    where: { slug },
    select: {
      servesRegion: true,
      openingHours: true,
      tradeName: true,
      city: { select: { name: true } },
      state: { select: { name: true, uf: true } },
    },
  });
  if (!company) {
    return NextResponse.json({ error: "Prestador não encontrado." }, { status: 404 });
  }

  const serviceAreaText = searchCity
    ? searchCity.id && company.city?.name
      ? company.servesRegion
        ? `Atende ${searchLocationLabel(searchCity)} e região.`
        : `Atende ${searchLocationLabel(searchCity)}.`
      : serviceAreaLabel(company)
    : serviceAreaLabel(company);

  return NextResponse.json({
    ...page,
    ...brief,
    openingHours: company.openingHours,
    tradeName: company.tradeName,
    serviceAreaText,
    serviceAreaLabel: page.areaLabel,
    reviewsEnabled: false,
    rating: null,
    reviewCount: null,
    reviewBadge: "Novo no Orçah",
  });
}
