import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBillingExempt, planView } from "../src/lib/plan";

describe("contas sem cobrança", () => {
  it("libera só os usuários 1 e 2", () => {
    assert.equal(isBillingExempt({ id: 1 }), true);
    assert.equal(isBillingExempt({ id: 2 }), true);
    assert.equal(isBillingExempt({ id: 3 }), false);
    assert.equal(isBillingExempt(null), false);
  });

  it("não mostra trial nem preço para plano liberado", () => {
    const plan = planView(
      { status: "trialing", endsAt: new Date(Date.now() - 86_400_000), provider: "complimentary" },
      { billingExempt: true },
    );
    assert.equal(plan.ok, true);
    assert.equal(plan.kind, "exempt");
    assert.equal(plan.label, "Plano liberado");
  });

  it("mantém a conta de análise quando também é admin", () => {
    const plan = planView(
      { status: "active", endsAt: null, provider: "complimentary" },
      { isAdmin: true, billingExempt: true },
    );
    assert.equal(plan.kind, "admin");
  });
});
