import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardCheckoutAlreadyStarted, existingAsaasCheckoutMethod } from "../src/lib/asaas-checkout";

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
  it("distingue métodos e não reutiliza assinaturas canceladas", () => {
    const pix = { provider: "asaas", billingType: "PIX", providerSubscriptionId: "sub_pix", status: "trialing" };
    assert.equal(existingAsaasCheckoutMethod(pix), "PIX");
    assert.equal(cardCheckoutAlreadyStarted(pix), false);
    assert.equal(existingAsaasCheckoutMethod({ ...pix, billingType: "CREDIT_CARD" }), "CREDIT_CARD");
    assert.equal(existingAsaasCheckoutMethod({ ...pix, status: "canceled" }), null);
    assert.equal(existingAsaasCheckoutMethod({ ...pix, providerSubscriptionId: null }), null);
    assert.equal(cardCheckoutAlreadyStarted({ ...pix, billingType: "CREDIT_CARD", status: "canceled" }), false);
  });
});
