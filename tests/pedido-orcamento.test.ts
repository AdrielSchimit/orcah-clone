import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contextoDoPedido } from "../src/lib/pedido-orcamento";

describe("orçamento a partir de pedido", () => {
  it("preenche serviço, contexto e bairro sem redigitar", () => {
    const contexto = contextoDoPedido({
      desiredService: " Pintura da sala ",
      description: "Parede com infiltração",
      neighborhood: " Centro ",
      preferredTime: "manhã",
    });

    assert.equal(contexto.service, "Pintura da sala");
    assert.equal(contexto.address, "Centro");
    assert.equal(contexto.notes, "Parede com infiltração\nHorário preferido: manhã");
  });

  it("aceita pedido só com o nome do serviço", () => {
    const contexto = contextoDoPedido({ desiredService: "Revisão elétrica" });
    assert.equal(contexto.service, "Revisão elétrica");
    assert.equal(contexto.notes, "");
    assert.equal(contexto.address, "");
  });
});
