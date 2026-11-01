import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cheapestOfferIds,
  parseIdList,
  parseOfferPrice,
  parseQuoteItems,
  parseSupplierInput,
  quoteRequestMessage,
  reservationMessage,
  reservationTotal,
} from "../src/lib/product-quote";

describe("cotação de produtos", () => {
  it("valida o vendedor e guarda o WhatsApp só com dígitos", () => {
    const ok = parseSupplierInput({ name: " João ", store: "", whatsapp: "(49) 9 9999-0000" });
    assert.deepEqual(ok, { data: { name: "João", store: null, whatsapp: "49999990000" } });
    assert.ok("error" in parseSupplierInput({ name: "João", whatsapp: "123" }));
    assert.ok("error" in parseSupplierInput({ name: "", whatsapp: "49999990000" }));
  });

  it("lê os itens, ignora linhas vazias e aceita quantidade com vírgula", () => {
    const parsed = parseQuoteItems([
      { description: "  Cimento  CP II ", quantity: "10" },
      { description: "", quantity: "3" },
      { description: "Areia m³", quantity: "2,5" },
    ]);
    assert.deepEqual(parsed, {
      data: [
        { description: "Cimento CP II", quantity: 10 },
        { description: "Areia m³", quantity: 2.5 },
      ],
    });
    assert.ok("error" in parseQuoteItems([]));
    assert.ok("error" in parseQuoteItems([{ description: "Brita", quantity: "0" }]));
  });

  it("preço em branco quer dizer que o vendedor não tem o item", () => {
    assert.equal(parseOfferPrice(""), null);
    assert.equal(parseOfferPrice("0"), null);
    assert.equal(parseOfferPrice("1.234,50"), 1234.5);
    assert.deepEqual(parseIdList([3, "3", "x", -1, 4]), [3, 4]);
  });

  it("seleciona o mais barato de cada item e ignora quem não tem", () => {
    const ids = cheapestOfferIds([
      { id: 1, itemId: 10, unitPrice: 30 },
      { id: 2, itemId: 10, unitPrice: 28 },
      { id: 3, itemId: 11, unitPrice: null },
      { id: 4, itemId: 11, unitPrice: 5 },
      { id: 5, itemId: 12, unitPrice: 7 },
      { id: 6, itemId: 12, unitPrice: 7 },
    ]);
    assert.deepEqual(ids.sort(), [2, 4, 5]);
  });

  it("mensagens levam o link e só os itens do vendedor", () => {
    const pedido = quoteRequestMessage({ supplierName: "João Silva", companyName: "Obra Boa", itemCount: 3, url: "https://x/cotacao/AB" });
    assert.match(pedido, /^Oi, João!/);
    assert.match(pedido, /\(3 itens\)/);
    assert.match(pedido, /https:\/\/x\/cotacao\/AB$/);

    const lines = [
      { description: "Cimento", quantity: 10, brand: "Votoran", unitPrice: 28 },
      { description: "Areia", quantity: 2.5, brand: null, unitPrice: 100 },
    ];
    assert.equal(reservationTotal(lines), 530);
    const reserva = reservationMessage({ supplierName: "Ana", companyName: "Obra Boa", lines });
    assert.match(reserva, /10x Cimento \(Votoran\)/);
    assert.match(reserva, /2,5x Areia ·/);
    assert.match(reserva, /Total: R\$\s530,00/);
  });
});
