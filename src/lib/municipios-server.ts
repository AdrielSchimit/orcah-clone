import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeMunicipioSearch, type Municipio } from "./municipios";
import type { Prisma } from "@prisma/client";
import { slugify } from "./text";

// Apenas no servidor; nunca importar o JSON no componente cliente.
// O arquivo só muda com um novo deploy, então é seguro reutilizar a leitura
// durante a vida da instância serverless.
let municipiosCache: Promise<Municipio[]> | undefined;

export function readMunicipios() {
  return municipiosCache ??= readFile(join(process.cwd(), "public/data/municipios-br.json"), "utf8")
    .then((content) => JSON.parse(content) as Municipio[])
    .catch((error) => {
      municipiosCache = undefined;
      throw error;
    });
}

export function resolveMunicipio(items: Municipio[], ibge: unknown) {
  return typeof ibge === "string" ? items.find(item => item.ibge === ibge) ?? null : null;
}

export function resolveSavedMunicipio(items: Municipio[], city: { ibgeCode: string | null; name: string } | null, uf: string) {
  if (!city) return null;
  const item = resolveMunicipio(items, city.ibgeCode) ?? items.find(item => item.uf === uf && normalizeMunicipioSearch(item.nome) === normalizeMunicipioSearch(city.name));
  return item ? { ibge: item.ibge, nome: item.nome, uf: item.uf } : null;
}

export async function persistSelectedMunicipio(db: Pick<Prisma.TransactionClient, "state" | "city">, municipality: Municipio) {
  const state = await db.state.findUnique({ where: { uf: municipality.uf }, select: { id: true } });
  if (!state) return null;
  const city = await db.city.upsert({
    where: { stateId_slug: { stateId: state.id, slug: slugify(municipality.nome) } },
    create: { stateId: state.id, slug: slugify(municipality.nome), name: municipality.nome, ibgeCode: municipality.ibge },
    update: { name: municipality.nome, ibgeCode: municipality.ibge },
  });
  return { stateId: state.id, cityId: city.id };
}
