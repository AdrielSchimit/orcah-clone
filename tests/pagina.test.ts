import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findActiveAssistedSetup, requestAssistedSetup, type AssistedSetupDb } from "../src/lib/assisted-setup";
import { normalizeCompanyPagePatch, pageCompleteness } from "../src/lib/company-page";
import { getPublicCompanyPage, normalizeHexColor, readableTextColor, type PublicPageDb } from "../src/lib/public-page";
import { table } from "./helpers/fake-db";

// empresa como vem do banco, com campos privados que NÃO podem vazar
const pinturaNorte = {
  id: 7,
  userId: 99,
  slug: "pintura-norte",
  name: "Pintura Norte",
  description: "Pintura residencial e comercial.",
  document: "12345678000190",
  email: "dono@pinturanorte.com.br",
  address: "Rua Secreta, 123",
  neighborhood: "Centro",
  zipCode: "14000-000",
  phone: "16999990000",
  whatsapp: "16999990000",
  instagram: "pinturanorte",
  facebook: null,
  website: null,
  openingHours: "Seg a sáb, 8h às 18h",
  primaryColor: "#14532D",
  secondaryColor: "fc0",
  logoPath: "https://x.supabase.co/storage/v1/object/public/company-assets/companies/7/logo/a.webp",
  servesRegion: true,
  customRamoName: null,
  businessCategory: { name: "Pintor" },
  city: { name: "Ribeirão Preto" },
  state: { name: "São Paulo", uf: "SP" },
  photos: [{ id: 1, path: "/uploads/companies/7/gallery/a.webp", title: "Fachada" }],
  services: [
    { id: 1, name: "Textura", description: null, category: "Pintura", imagePath: null, featured: true, showPrice: true, defaultPrice: "40.00", unit: "m²" },
    { id: 2, name: "Pintura residencial", description: "Casa toda", category: "Pintura", imagePath: null, featured: false, showPrice: false, defaultPrice: "35.00", unit: "m²" },
  ],
};

const db = {
  company: {
    async findUnique({ where }: { where: { slug: string } }) {
      return where.slug === pinturaNorte.slug ? pinturaNorte : null;
    },
  },
} as unknown as PublicPageDb;

describe("página pública", () => {
  it("slug público funciona e monta a página", async () => {
    const page = await getPublicCompanyPage(db, "pintura-norte");
    assert.ok(page);
    assert.equal(page.name, "Pintura Norte");
    assert.equal(page.ramo, "Pintor");
    assert.equal(page.areaLabel, "Ribeirão Preto - SP e região");
    assert.equal(page.primaryColor, "#14532d");
    assert.equal(page.secondaryColor, "#ffcc00");
  });

  it("empresa inexistente devolve nada (a página vira 404)", async () => {
    assert.equal(await getPublicCompanyPage(db, "nao-existe"), null);
    assert.equal(await getPublicCompanyPage(db, ""), null);
  });

  it("somente campos públicos aparecem", async () => {
    const page = await getPublicCompanyPage(db, "pintura-norte");
    const json = JSON.stringify(page);
    for (const secret of ["12345678000190", "dono@pinturanorte.com.br", "Rua Secreta", "14000-000", '"userId"', '"document"', '"email"']) {
      assert.ok(!json.includes(secret), `vazou ${secret}`);
    }
  });

  it("preço só sai quando o prestador escolhe mostrar", async () => {
    const page = await getPublicCompanyPage(db, "pintura-norte");
    assert.ok(page);
    assert.equal(page.services.find((s) => s.name === "Textura")?.price, 40);
    assert.equal(page.services.find((s) => s.name === "Pintura residencial")?.price, null);
    assert.ok(!JSON.stringify(page).includes("35"), "preço escondido não pode ir para o navegador");
  });

  it("cores: hex válido e texto com contraste", () => {
    assert.equal(normalizeHexColor("abc"), "#aabbcc");
    assert.equal(normalizeHexColor("vermelho"), null);
    assert.equal(readableTextColor("#0b1120"), "#ffffff");
    assert.equal(readableTextColor("#f5f0e6"), "#151f38");
  });
});

describe("editor da página", () => {
  it("salva só os campos enviados e ignora campos de outra empresa", () => {
    const result = normalizeCompanyPagePatch({
      description: "  Pintura caprichada  ",
      instagram: "https://instagram.com/pinturanorte/",
      companyId: 999,
      slug: "outra-empresa",
      userId: 1,
      logoPath: "/uploads/companies/999/logo/x.webp",
    });
    assert.ok("data" in result);
    assert.deepEqual(result.data, { description: "Pintura caprichada", instagram: "pinturanorte" });
    assert.equal(result.region, null);
  });

  it("valida nome, WhatsApp e cores", () => {
    assert.deepEqual(normalizeCompanyPagePatch({ name: "a" }), { error: "Informe o nome do seu negócio." });
    assert.deepEqual(normalizeCompanyPagePatch({ whatsapp: "123" }), { error: "Informe o WhatsApp com DDD." });
    assert.deepEqual(normalizeCompanyPagePatch({ primaryColor: "azul" }), { error: "Cor inválida." });
    const ok = normalizeCompanyPagePatch({ whatsapp: "(16) 99999-0000", primaryColor: "", stateId: "25", cityName: "Ribeirão Preto" });
    assert.ok("data" in ok);
    assert.equal(ok.data.whatsapp, "16999990000");
    assert.equal(ok.data.primaryColor, null);
    assert.deepEqual(ok.region, { stateId: 25, cityName: "Ribeirão Preto" });
  });

  it("progresso da página orienta sem bloquear", () => {
    const empty = pageCompleteness({
      logoPath: null,
      description: null,
      whatsapp: "16999990000",
      openingHours: null,
      instagram: null,
      website: null,
      facebook: null,
      servicesCount: 0,
      photosCount: 0,
    });
    assert.equal(empty.percent, 14);
    assert.equal(empty.missing[0].key, "servicos");

    const full = pageCompleteness({
      logoPath: "x",
      description: "Pinto casas",
      whatsapp: "16999990000",
      openingHours: "8h às 18h",
      instagram: "pinturanorte",
      website: null,
      facebook: null,
      servicesCount: 3,
      photosCount: 2,
    });
    assert.equal(full.percent, 100);
    assert.equal(full.missing.length, 0);
  });
});

describe("configuração assistida", () => {
  function setupDb() {
    const assistedSetupRequest = table({ status: "requested", notes: null });
    return { assistedSetupRequest, db: { assistedSetupRequest } as unknown as AssistedSetupDb };
  }

  it("cria o pedido", async () => {
    const { assistedSetupRequest, db: setup } = setupDb();
    const result = await requestAssistedSetup(setup, 7, "Quero ajuda com as fotos");
    assert.equal(result.created, true);
    assert.equal(assistedSetupRequest.rows[0].companyId, 7);
    assert.equal(assistedSetupRequest.rows[0].status, "requested");
  });

  it("não duplica pedido ativo", async () => {
    const { assistedSetupRequest, db: setup } = setupDb();
    await requestAssistedSetup(setup, 7);
    const again = await requestAssistedSetup(setup, 7);
    assert.equal(again.created, false);
    assert.equal(assistedSetupRequest.rows.length, 1);

    // concluído/cancelado libera um novo pedido
    assistedSetupRequest.rows[0].status = "completed";
    const next = await requestAssistedSetup(setup, 7);
    assert.equal(next.created, true);
  });

  it("empresa só vê o seu pedido", async () => {
    const { db: setup } = setupDb();
    await requestAssistedSetup(setup, 7);
    assert.equal(await findActiveAssistedSetup(setup, 8), null);
    assert.ok(await findActiveAssistedSetup(setup, 7));
  });
});
