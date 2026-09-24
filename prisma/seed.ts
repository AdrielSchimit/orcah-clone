import { PrismaClient } from "@prisma/client";
import { ramos } from "./data/ramos";

const prisma = new PrismaClient();

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const states = [
  { name: "Acre", uf: "AC", ibgeCode: "12" },
  { name: "Alagoas", uf: "AL", ibgeCode: "27" },
  { name: "Amapá", uf: "AP", ibgeCode: "16" },
  { name: "Amazonas", uf: "AM", ibgeCode: "13" },
  { name: "Bahia", uf: "BA", ibgeCode: "29" },
  { name: "Ceará", uf: "CE", ibgeCode: "23" },
  { name: "Distrito Federal", uf: "DF", ibgeCode: "53" },
  { name: "Espírito Santo", uf: "ES", ibgeCode: "32" },
  { name: "Goiás", uf: "GO", ibgeCode: "52" },
  { name: "Maranhão", uf: "MA", ibgeCode: "21" },
  { name: "Mato Grosso", uf: "MT", ibgeCode: "51" },
  { name: "Mato Grosso do Sul", uf: "MS", ibgeCode: "50" },
  { name: "Minas Gerais", uf: "MG", ibgeCode: "31" },
  { name: "Pará", uf: "PA", ibgeCode: "15" },
  { name: "Paraíba", uf: "PB", ibgeCode: "25" },
  { name: "Paraná", uf: "PR", ibgeCode: "41" },
  { name: "Pernambuco", uf: "PE", ibgeCode: "26" },
  { name: "Piauí", uf: "PI", ibgeCode: "22" },
  { name: "Rio de Janeiro", uf: "RJ", ibgeCode: "33" },
  { name: "Rio Grande do Norte", uf: "RN", ibgeCode: "24" },
  { name: "Rio Grande do Sul", uf: "RS", ibgeCode: "43" },
  { name: "Rondônia", uf: "RO", ibgeCode: "11" },
  { name: "Roraima", uf: "RR", ibgeCode: "14" },
  { name: "Santa Catarina", uf: "SC", ibgeCode: "42" },
  { name: "São Paulo", uf: "SP", ibgeCode: "35" },
  { name: "Sergipe", uf: "SE", ibgeCode: "28" },
  { name: "Tocantins", uf: "TO", ibgeCode: "17" },
];

const capitalCities: { uf: string; name: string; ibgeCode: string }[] = [
  { uf: "AC", name: "Rio Branco", ibgeCode: "1200401" },
  { uf: "AL", name: "Maceió", ibgeCode: "2704302" },
  { uf: "AP", name: "Macapá", ibgeCode: "1600303" },
  { uf: "AM", name: "Manaus", ibgeCode: "1302603" },
  { uf: "BA", name: "Salvador", ibgeCode: "2927408" },
  { uf: "CE", name: "Fortaleza", ibgeCode: "2304400" },
  { uf: "DF", name: "Brasília", ibgeCode: "5300108" },
  { uf: "ES", name: "Vitória", ibgeCode: "3205309" },
  { uf: "GO", name: "Goiânia", ibgeCode: "5208707" },
  { uf: "MA", name: "São Luís", ibgeCode: "2111300" },
  { uf: "MT", name: "Cuiabá", ibgeCode: "5103403" },
  { uf: "MS", name: "Campo Grande", ibgeCode: "5002704" },
  { uf: "MG", name: "Belo Horizonte", ibgeCode: "3106200" },
  { uf: "PA", name: "Belém", ibgeCode: "1501402" },
  { uf: "PB", name: "João Pessoa", ibgeCode: "2507507" },
  { uf: "PR", name: "Curitiba", ibgeCode: "4106902" },
  { uf: "PE", name: "Recife", ibgeCode: "2611606" },
  { uf: "PI", name: "Teresina", ibgeCode: "2211001" },
  { uf: "RJ", name: "Rio de Janeiro", ibgeCode: "3304557" },
  { uf: "RN", name: "Natal", ibgeCode: "2408102" },
  { uf: "RS", name: "Porto Alegre", ibgeCode: "4314902" },
  { uf: "RO", name: "Porto Velho", ibgeCode: "1100205" },
  { uf: "RR", name: "Boa Vista", ibgeCode: "1400100" },
  { uf: "SC", name: "Florianópolis", ibgeCode: "4205407" },
  { uf: "SP", name: "São Paulo", ibgeCode: "3550308" },
  { uf: "SE", name: "Aracaju", ibgeCode: "2800308" },
  { uf: "TO", name: "Palmas", ibgeCode: "1721000" },
];

const extraCities: { uf: string; name: string; ibgeCode: string }[] = [
  { uf: "SC", name: "Maravilha", ibgeCode: "4210100" },
  { uf: "SC", name: "Chapecó", ibgeCode: "4204202" },
  { uf: "SC", name: "Joinville", ibgeCode: "4209102" },
  { uf: "SC", name: "Blumenau", ibgeCode: "4202404" },
  { uf: "SC", name: "Itajaí", ibgeCode: "4208203" },
  { uf: "PR", name: "Londrina", ibgeCode: "4113700" },
  { uf: "RS", name: "Caxias do Sul", ibgeCode: "4305108" },
  { uf: "SP", name: "Campinas", ibgeCode: "3509502" },
  { uf: "MG", name: "Uberlândia", ibgeCode: "3170206" },
];

async function main() {
  for (const state of states) {
    await prisma.state.upsert({
      where: { uf: state.uf },
      update: { name: state.name, ibgeCode: state.ibgeCode },
      create: state,
    });
  }

  const stateRows = await prisma.state.findMany();
  const stateByUf = Object.fromEntries(stateRows.map((row) => [row.uf, row]));

  for (const city of [...capitalCities, ...extraCities]) {
    const state = stateByUf[city.uf];
    if (!state) continue;

    await prisma.city.upsert({
      where: { ibgeCode: city.ibgeCode },
      update: {
        name: city.name,
        slug: slugify(city.name),
        stateId: state.id,
      },
      create: {
        name: city.name,
        slug: slugify(city.name),
        ibgeCode: city.ibgeCode,
        stateId: state.id,
      },
    });
  }

  const keepSlugs = ramos.map((ramo) => ramo.slug);
  for (const ramo of ramos) {
    await prisma.businessCategory.upsert({
      where: { slug: ramo.slug },
      update: {
        name: ramo.name,
        templateKey: ramo.templateKey,
        searchAliases: ramo.aliases,
        active: true,
      },
      create: {
        name: ramo.name,
        slug: ramo.slug,
        templateKey: ramo.templateKey,
        searchAliases: ramo.aliases,
      },
    });
  }
  await prisma.businessCategory.updateMany({
    where: { slug: { notIn: keepSlugs } },
    data: { active: false },
  });

  const stateCount = await prisma.state.count();
  const cityCount = await prisma.city.count();
  const categoryCount = await prisma.businessCategory.count();

  console.log(
    `Seed ok: ${stateCount} estados, ${cityCount} cidades, ${categoryCount} ramos.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
