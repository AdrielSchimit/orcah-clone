import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { budgetSharePreview, companySharePreview } from "../src/lib/share-preview";

describe("card de compartilhamento", () => {
  it("monta o card da empresa com ramo, lugar e texto", () => {
    const card = companySharePreview({
      name: "Pintada",
      ramo: "Pintor",
      place: "Maravilha - SC",
      description: "Melhor pintada da cidade",
      host: "https://pintada.orcah.com.br",
    });
    assert.equal(card.title, "Pintada");
    assert.equal(card.eyebrow, "Pintor · Maravilha - SC");
    assert.equal(card.description, "Melhor pintada da cidade");
    assert.equal(card.footer, "pintada.orcah.com.br");
  });

  it("não usa o nome da página como descrição quando ela já existe", () => {
    const card = companySharePreview({
      name: "Pintura Norte",
      ramo: "Pintor",
      place: "Ribeirão Preto - SP e região",
      description: "",
      host: "pintura-norte.orcah.com.br",
    });
    assert.equal(card.description, "Peça seu orçamento para Pintura Norte pelo celular.");
    assert.equal(card.title, "Pintura Norte");
  });

  it("corta texto longo para caber no card do celular", () => {
    const card = companySharePreview({
      name: "Empresa",
      description: "a".repeat(200),
      host: "empresa.orcah.com.br",
    });
    assert.ok(card.description.length <= 140);
    assert.ok(card.description.endsWith("…"));
  });

  it("monta o card do orçamento com serviço e valor, sem nome de cliente", () => {
    const card = budgetSharePreview({
      companyName: "Pintada",
      number: "2026-014",
      service: "Pintura da sala",
      totalLabel: "R$ 2.450,00",
    });
    assert.equal(card.eyebrow, "Orçamento");
    assert.equal(card.title, "Pintada");
    assert.equal(card.description, "Pintura da sala · R$ 2.450,00");
    assert.equal(card.footer, "2026-014");
    assert.equal(JSON.stringify(card).includes("Maria"), false);
  });
});
