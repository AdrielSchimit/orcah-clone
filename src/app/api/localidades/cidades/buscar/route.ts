import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readMunicipios } from "@/lib/municipios-server";
import { searchMunicipios } from "@/lib/municipios";
import { formatCitySearchParam } from "@/lib/provider-location";
import { slugify } from "@/lib/text";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const cities = searchMunicipios(await readMunicipios(), q, 12);
  const ufs = [...new Set(cities.map((city) => city.uf))];

  const [states, persistedCities] = await Promise.all([
    prisma.state.findMany({
      where: { uf: { in: ufs } },
      select: { id: true, uf: true, name: true },
    }),
    prisma.city.findMany({
      where: { ibgeCode: { in: cities.map((city) => city.ibge) } },
      select: { id: true, ibgeCode: true },
    }),
  ]);

  const stateByUf = new Map(states.map((state) => [state.uf, state]));
  const persistedByIbge = new Map(
    persistedCities
      .filter((city): city is typeof city & { ibgeCode: string } => Boolean(city.ibgeCode))
      .map((city) => [city.ibgeCode, city.id]),
  );

  return NextResponse.json(
    cities.map((city) => {
      const state = stateByUf.get(city.uf);
      const slug = slugify(city.nome);
      return {
        id: persistedByIbge.get(city.ibge) ?? 0,
        ibge: city.ibge,
        name: city.nome,
        uf: city.uf,
        stateName: state?.name ?? city.uf,
        label: `${city.nome} - ${city.uf}`,
        param: formatCitySearchParam({ slug }, { uf: city.uf }),
      };
    }),
  );
}
