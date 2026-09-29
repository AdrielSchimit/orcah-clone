import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WHATSAPP_PHONE_EMPTY,
  WHATSAPP_PHONE_INVALID,
  whatsappBudgetMessage,
  whatsappCta,
  whatsappHref,
  whatsappIntent,
  whatsappNumber,
  whatsappPhoneError,
} from "../src/lib/whatsapp";

const base = {
  customerName: "Maria Souza",
  number: "2026-014",
  totalLabel: "R$ 2.450,00",
  url: "https://orcah.app/orcamento/abc",
};

describe("mensagens do WhatsApp", () => {
  it("orçamento novo é curto e leva o link", () => {
    const text = whatsappBudgetMessage({ ...base, status: "draft" });
    assert.match(text, /^Oi, Maria!/);
    assert.match(text, /Segue o orçamento/);
    assert.match(text, /2026-014 · R\$ 2\.450,00/);
    assert.match(text, /Abre aqui:\nhttps:\/\/orcah\.app\/orcamento\/abc$/);
    assert.equal(whatsappCta(whatsappIntent("draft")).label, "Mandar no WhatsApp");
  });

  it("alteração e republicação usam o mesmo aviso", () => {
    const waiting = whatsappBudgetMessage({ ...base, status: "waiting" });
    const republished = whatsappBudgetMessage({ ...base, status: "sent", republished: true });
    assert.match(waiting, /Atualizei o orçamento do jeito que você pediu/);
    assert.match(waiting, /O link é o mesmo/);
    assert.equal(waiting, republished);
    assert.equal(whatsappCta("alteracao").label, "Mandar a alteração");
  });

  it("follow-up, aprovação, recusa e prazo vencido", () => {
    assert.match(whatsappBudgetMessage({ ...base, status: "viewed" }), /Conseguiu ver o orçamento\?/);
    assert.match(whatsappBudgetMessage({ ...base, status: "sent" }), /Conseguiu ver o orçamento\?/);
    assert.match(whatsappBudgetMessage({ ...base, status: "approved" }), /Vi que você aprovou\. Obrigado!/);
    assert.match(whatsappBudgetMessage({ ...base, status: "rejected" }), /eu ajusto o orçamento/);
    assert.match(whatsappBudgetMessage({ ...base, status: "expired" }), /O prazo desse orçamento venceu/);
    assert.equal(whatsappCta("lembrete").label, "Mandar um lembrete");
    assert.equal(whatsappCta("aprovado").label, "Agradecer no WhatsApp");
  });
});

describe("número de WhatsApp", () => {
  it("aceita celular e fixo, com ou sem 55", () => {
    assert.equal(whatsappNumber("(11) 9 9999-9999"), "5511999999999");
    assert.equal(whatsappNumber("5511999999999"), "5511999999999");
    assert.equal(whatsappNumber("(51) 3333-4444"), "555133334444");
    assert.equal(whatsappNumber("555133334444"), "555133334444");
    assert.equal(whatsappNumber("(55) 9 8888-7777"), "5555988887777");
  });

  it("recusa vazio, curto e celular sem o 9", () => {
    assert.equal(whatsappPhoneError(""), WHATSAPP_PHONE_EMPTY);
    assert.equal(whatsappPhoneError("   "), WHATSAPP_PHONE_EMPTY);
    assert.equal(whatsappPhoneError("119999999"), WHATSAPP_PHONE_INVALID);
    assert.equal(whatsappPhoneError("(11) 9999-9999"), WHATSAPP_PHONE_INVALID);
    assert.equal(whatsappNumber("123"), "");
    assert.equal(whatsappHref("123", "oi"), "");
  });
});
