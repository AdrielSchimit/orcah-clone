import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ramos } from "../prisma/data/ramos";
import { buildBudgetPdf } from "../src/lib/pdf-budget";
import {
  CASOS_PRINCIPAIS,
  EXCECOES_BASE,
  FAMILIAS,
  duplicidadesRamos,
  exportarCatalogo,
  familiasAgrupadas,
  inventarioRamos,
  previewCliente,
  vinculosRamoMolde,
} from "../src/lib/ramo-catalogo";
import { ramoMoldes } from "../src/lib/ramo-moldes";
import { companyTemplate, isTemplateKey } from "../src/lib/templates";

const DUPLICIDADES_MARCADAS = [
  "ambientacao",
  "cobertura",
  "fogao",
  "janela",
  "madeira",
  "reforma",
  "sacada",
  "sofa",
];

describe("inventário de ramos", () => {
  it("cataloga cada ramo uma vez e exporta o mesmo catálogo", () => {
    const catalogo = exportarCatalogo();
    const slugs = catalogo.ramos.map((ramo) => ramo.slug);
    assert.equal(slugs.length, ramos.length);
    assert.equal(new Set(slugs).size, slugs.length);
    assert.deepEqual(catalogo, exportarCatalogo());
    const salvo = JSON.parse(readFileSync(new URL("../docs/catalogo-ramos.json", import.meta.url), "utf8"));
    assert.deepEqual(salvo, catalogo);
  });

  it("agrupa todos os ramos nas famílias", () => {
    const grupos = familiasAgrupadas();
    assert.deepEqual(
      grupos.map((grupo) => grupo.key),
      FAMILIAS.map((familia) => familia.key),
    );
    const cobertos = grupos.flatMap((grupo) => grupo.ramos);
    assert.equal(cobertos.length, ramos.length);
    assert.ok(grupos.every((grupo) => grupo.ramos.length > 0 && grupo.clienteVe.length > 0));
  });

  it("marca só as duplicidades de busca conhecidas", () => {
    const duplicidades = duplicidadesRamos();
    assert.deepEqual(
      duplicidades.map((item) => item.termo),
      DUPLICIDADES_MARCADAS,
    );
    assert.ok(duplicidades.every((item) => item.tipo === "alias-compartilhado" && item.slugs.length >= 2));
    for (const ficha of inventarioRamos()) {
      for (const termo of ficha.duplicidades) assert.ok(DUPLICIDADES_MARCADAS.includes(termo));
    }
  });
});

describe("ramo para molde", () => {
  it("liga cada ramo a um molde fino e a uma família válida", () => {
    const vinculos = vinculosRamoMolde();
    assert.equal(vinculos.length, ramos.length);
    assert.equal(Object.keys(ramoMoldes).length, ramos.length);
    for (const vinculo of vinculos) {
      assert.equal(vinculo.moldeFino, true);
      assert.ok(isTemplateKey(vinculo.familia));
      assert.ok(ramoMoldes[vinculo.slug]);
    }
  });

  it("exige exceção escrita para quem fica no molde base", () => {
    const base = ramos.filter((ramo) => ramo.templateKey === "base").map((ramo) => ramo.slug).sort();
    assert.deepEqual(base, Object.keys(EXCECOES_BASE).sort());
    for (const vinculo of vinculosRamoMolde()) {
      if (vinculo.familia === "base") assert.equal(typeof vinculo.excecao, "string");
      else assert.equal(vinculo.excecao, null);
    }
  });
});

describe("campos e regras", () => {
  it("documenta unidade padrão, campos obrigatórios e regras de cada molde", () => {
    for (const ficha of inventarioRamos()) {
      const molde = ramoMoldes[ficha.slug];
      assert.ok(ficha.unidades.includes(ficha.unidadePadrao));
      assert.deepEqual(ficha.unidades, molde.units);
      assert.ok(ficha.campos.some((campo) => campo.campo === "descricao" && campo.obrigatorio));
      assert.ok(ficha.campos.some((campo) => campo.campo === "quantidade" && campo.obrigatorio));
      assert.ok(ficha.campos.some((campo) => campo.campo === "valor" && campo.obrigatorio && campo.unidade === "R$"));
      assert.ok(ficha.campos.some((campo) => campo.campo === "unidade" && campo.unidade === ficha.unidadePadrao));
      assert.ok(ficha.regras.length > 0);
      for (const suggestion of molde.suggestions) {
        assert.ok(molde.units.includes(suggestion.unit), `${ficha.slug}: ${suggestion.name} usa ${suggestion.unit}`);
      }
    }
  });
});

describe("preview do cliente", () => {
  it("mostra o mesmo conteúdo no desktop, no celular e nas linhas do PDF", () => {
    for (const slug of Object.values(CASOS_PRINCIPAIS)) {
      const preview = previewCliente(slug);
      assert.ok(preview.titulo.length > 0);
      assert.deepEqual(preview.desktop, preview.mobile);
      assert.ok(preview.linhas.includes("Serviço em Maravilha-SC"));
      for (const linha of preview.pdf) assert.ok(preview.linhas.includes(linha), linha);
    }
  });

  it("gera PDF dos casos principais", async () => {
    for (const [familia, slug] of Object.entries(CASOS_PRINCIPAIS)) {
      const preview = previewCliente(slug);
      const pdf = await buildBudgetPdf(
        {
          number: `RC-${familia}`,
          createdAt: new Date("2026-09-29T12:00:00Z"),
          validityDate: new Date("2026-10-06T12:00:00Z"),
          estimatedDays: 5,
          notes: null,
          serviceAddress: "Rua A, 10",
          extras: null,
          subtotal: "100",
          discount: "0",
          total: "100",
          customer: { name: "Maria", phone: "49999990000" },
          company: {
            name: "Oficina Teste",
            phone: "49999990000",
            whatsapp: "49999990000",
            email: "teste@orcah.com",
          },
          serviceCity: { name: "Maravilha" },
          serviceState: { uf: "SC" },
          items: [
            {
              description: "Serviço de exemplo",
              quantity: "1",
              unit: preview.unidadePadrao,
              unitPrice: "100",
              subtotal: "100",
            },
          ],
        },
        companyTemplate({ businessCategory: { templateKey: familia, slug } }),
      );
      assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
      assert.ok(pdf.length > 1000);
    }
  });
});

describe("regressão", () => {
  it("cobre uma família por caso principal e o seed do cadastro", () => {
    assert.deepEqual(Object.keys(CASOS_PRINCIPAIS).sort(), FAMILIAS.map((familia) => familia.key).sort());
    for (const slug of Object.values(CASOS_PRINCIPAIS)) {
      assert.ok(ramos.some((ramo) => ramo.slug === slug));
    }
    const seed = readFileSync(new URL("../prisma/seed.ts", import.meta.url), "utf8");
    assert.match(seed, /from "\.\/data\/ramos"/);
    assert.match(seed, /businessCategory\.upsert/);
  });
});
