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

  it("rounds percent discount to cents and keeps discount + total equal to subtotal", () => {
    // 15% de 99,99 = 14,9985 → 15,00
    const result = calculateDiscount(99.99, "percent", "15");
    assert.deepEqual(result, {
      discountType: "percent",
      discountValue: 15,
      discountAmount: 15,
      total: 84.99,
    });
    if ("error" in result) throw new Error(result.error);
    assert.equal(Math.round((result.discountAmount + result.total) * 100), 9999);
  });

  it("rounds a repeating percent down payment to cents without losing a cent in the balance", () => {
    // 33,33% de 1000 = 333,30; saldo fecha em 666,70
    const result = calculateDownPayment(1000, "percent", "33,33");
    assert.deepEqual(result, {
      downPaymentType: "percent",
      downPaymentValue: 33.33,
      downPaymentAmount: 333.3,
      balanceAmount: 666.7,
    });
    if ("error" in result) throw new Error(result.error);
    assert.equal(Math.round((result.downPaymentAmount + result.balanceAmount) * 100), 100000);
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
