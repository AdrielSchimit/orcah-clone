import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatCitySearchParam } from "@/lib/provider-location";
import { normalizeSearch, slugify } from "@/lib/text";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const needle = normalizeSearch(q);
  const slugNeedle = slugify(q);

  const cities = await prisma.city.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        ...(slugNeedle ? [{ slug: { contains: slugNeedle } }] : []),
      ],
    },
    orderBy: [{ name: "asc" }],
    take: 12,
    select: {
      id: true,
      name: true,
      slug: true,
      state: { select: { uf: true, name: true } },
    },
  });

  const ranked = [...cities].sort((a, b) => {
    const aExact = normalizeSearch(a.name) === needle ? 0 : 1;
    const bExact = normalizeSearch(b.name) === needle ? 0 : 1;
    return aExact - bExact || a.name.localeCompare(b.name, "pt-BR");
  });

  return NextResponse.json(
    ranked.map((city) => ({
      id: city.id,
      name: city.name,
      uf: city.state.uf,
      stateName: city.state.name,
      label: `${city.name} - ${city.state.uf}`,
      param: formatCitySearchParam(city, city.state),
    })),
  );
}
