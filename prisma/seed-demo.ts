import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_SLUG = "pintura-norte";

const photos = [
  ["/demo/trabalho-fachada.webp", "Fachada residencial", "Pintura externa com acabamento acrílico."],
  ["/demo/trabalho-sala.webp", "Sala com parede de destaque", "Verde sálvia na parede principal."],
  ["/demo/trabalho-muro.webp", "Muro e portão", "Textura lisa e acabamento no rufo."],
  ["/demo/trabalho-acabamento.webp", "Recorte de teto", "Linha reta entre teto e parede."],
] as const;

async function main() {
  const state = await prisma.state.findFirst({ where: { uf: "SC" } });
  if (!state) throw new Error("Rode `npm run db:seed` antes: estado SC não encontrado.");
  const city = await prisma.city.findFirst({ where: { stateId: state.id, name: "Maravilha" } });
  const category = await prisma.businessCategory.findFirst({ where: { slug: "pintor" } });

  const user = await prisma.user.upsert({
    where: { email: "demo@orcah.com.br" },
    update: {},
    create: {
      name: "Pintura Norte (demo)",
      email: "demo@orcah.com.br",
      passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
    },
  });

  const data = {
    name: "Pintura Norte",
    stateId: state.id,
    cityId: city?.id ?? null,
    servesRegion: true,
    businessCategoryId: category?.id ?? null,
    customRamoName: category ? null : "Pintor",
    phone: "49999990000",
    whatsapp: "49999990000",
    email: "demo@orcah.com.br",
    description: "Pintura residencial e comercial, texturas e acabamento fino. Orçamento sem compromisso.",
    instagram: "@pinturanorte",
    openingHours: "Seg a sex, 7h às 17h · Sáb até 12h",
  };

  const company = await prisma.company.upsert({
    where: { slug: DEMO_SLUG },
    update: data,
    create: { ...data, slug: DEMO_SLUG, userId: user.id },
  });

  await prisma.companyPhoto.deleteMany({ where: { companyId: company.id } });
  await prisma.companyPhoto.createMany({
    data: photos.map(([path, title, description], sortOrder) => ({
      companyId: company.id,
      path,
      title,
      description,
      sortOrder,
    })),
  });

  console.log(`Loja de exemplo pronta: /empresa/${DEMO_SLUG}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
