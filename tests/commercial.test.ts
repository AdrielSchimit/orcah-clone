import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateDiscount, calculateDownPayment, normalizeCommercialTerms } from "../src/lib/commercial";

describe("commercial checkout calculations", () => {
  it("calculates percent discount", () => {
    const result = calculateDiscount(1875, "percent", "10");
    assert.deepEqual(result, {
      discountType: "percent",
      discountValue: 10,
      discountAmount: 187.5,
      total: 1687.5,
    });
  });

  it("calculates amount discount", () => {
    const result = calculateDiscount(1875, "amount", "125,50");
    assert.deepEqual(result, {
      discountType: "amount",
      discountValue: 125.5,
      discountAmount: 125.5,
      total: 1749.5,
    });
  });

  it("keeps zero discount valid", () => {
    const result = calculateDiscount(1875, "amount", "0");
    assert.deepEqual(result, {
      discountType: "amount",
      discountValue: 0,
      discountAmount: 0,
      total: 1875,
    });
  });

  it("rejects invalid discount above subtotal", () => {
    const result = calculateDiscount(100, "amount", "100,01");
    assert.deepEqual(result, { error: "Desconto maior que o subtotal." });
  });

  it("rejects negative discount", () => {
    const result = calculateDiscount(100, "amount", "-1");
    assert.deepEqual(result, { error: "Desconto inválido." });
  });

  it("rejects invalid percent discount", () => {
    const result = calculateDiscount(100, "percent", "101");
    assert.deepEqual(result, { error: "Desconto percentual não pode passar de 100%." });
  });

  it("calculates percent down payment and balance", () => {
    const result = calculateDownPayment(1687.5, "percent", "30");
    assert.deepEqual(result, {
      downPaymentType: "percent",
      downPaymentValue: 30,
      downPaymentAmount: 506.25,
      balanceAmount: 1181.25,
    });
  });

  it("calculates amount down payment and balance", () => {
    const result = calculateDownPayment(1687.5, "amount", "500");
    assert.deepEqual(result, {
      downPaymentType: "amount",
      downPaymentValue: 500,
      downPaymentAmount: 500,
      balanceAmount: 1187.5,
    });
  });

  it("normalizes full checkout terms", () => {
    const result = normalizeCommercialTerms(1875, {
      discountType: "percent",
      discountValue: "10",
      paymentMethod: "pix",
      acceptedPaymentMethods: ["pix", "cash"],
      paymentCondition: "deposit_balance",
      downPaymentType: "percent",
      downPaymentValue: "30",
    });

    assert.deepEqual(result, {
      discountType: "percent",
      discountValue: 10,
      discountAmount: 187.5,
      paymentMethod: "pix",
      acceptedPaymentMethods: ["pix", "cash"],
      paymentCondition: "deposit_balance",
      downPaymentType: "percent",
      downPaymentValue: 30,
      downPaymentAmount: 506.25,
      balanceAmount: 1181.25,
    });
  });

  it("rejects down payment above total", () => {
    const result = calculateDownPayment(100, "amount", "101");
    assert.deepEqual(result, { error: "Entrada maior que o total." });
  });

  it("rejects negative down payment", () => {
    const result = calculateDownPayment(100, "amount", "-1");
    assert.deepEqual(result, { error: "Entrada inválida." });
  });
});
