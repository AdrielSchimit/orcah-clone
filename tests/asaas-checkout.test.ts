import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardCheckoutAlreadyStarted } from "../src/lib/asaas-checkout";

describe("Asaas: impedir cobrança duplicada no cartão", () => {
  it("não considera uma conta sem assinatura como pagamento criado", () => {
    assert.equal(cardCheckoutAlreadyStarted(null), false);
    assert.equal(cardCheckoutAlreadyStarted({ provider: "local", billingType: null, providerSubscriptionId: null, status: "trialing" }), false);
  });
  it("reconhece cobranças em andamento após refresh e timeout", () => {
    for (const status of ["trialing", "past_due", "active"]) {
      assert.equal(cardCheckoutAlreadyStarted({
        provider: "asaas", billingType: "CREDIT_CARD",
        providerSubscriptionId: "sub_existing", status,
      }), true);
    }
  });
  it("não confunde Pix e não reutiliza assinaturas canceladas", () => {
    assert.equal(cardCheckoutAlreadyStarted({ provider: "asaas", billingType: "PIX", providerSubscriptionId: "sub_pix", status: "trialing" }), false);
    assert.equal(cardCheckoutAlreadyStarted({ provider: "asaas", billingType: "CREDIT_CARD", providerSubscriptionId: "sub_old", status: "canceled" }), false);
  });
});
