import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

/**
 * In-memory stand-in for prisma.subscription / prisma.company, injected through globalThis.prisma
 * (src/lib/db.ts reuses it outside production). Asaas is reached only through a mocked fetch.
 * This checks the claim/recovery logic; it is NOT a concurrency test against PostgreSQL.
 */
type Row = Record<string, unknown> & {
  id: number;
  companyId: number;
  updatedAt: Date;
  billingType: string | null;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
};
const rows: Row[] = [];

function same(a: unknown, b: unknown) {
  return a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;
}
function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return (cond as Record<string, unknown>[]).some((w) => matches(row, w));
    const value = row[key] ?? null;
    if (cond === null || cond instanceof Date || typeof cond !== "object") return same(value, cond);
    const c = cond as { in?: unknown[]; notIn?: unknown[]; not?: unknown };
    if (c.in && !c.in.includes(value)) return false;
    if (c.notIn && (value === null || c.notIn.includes(value))) return false;
    if ("not" in c && same(value, c.not)) return false;
    return true;
  });
}
let clock = Date.UTC(2026, 10, 24, 12);
const fake = {
  subscription: {
    async updateMany({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      const hit = rows.filter((row) => matches(row, where));
      for (const row of hit) Object.assign(row, data, { updatedAt: new Date((clock += 1000)) });
      return { count: hit.length };
    },
    async update({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      const row = rows.find((item) => matches(item, where));
      if (!row) throw new Error("not found");
      return Object.assign(row, data, { updatedAt: new Date((clock += 1000)) });
    },
    async findFirst({ where }: { where: Record<string, unknown> }) {
      const row = rows.find((item) => matches(item, where));
      return row ? { ...row } : null;
    },
    async findUnique({ where }: { where: Record<string, unknown> }) {
      const row = rows.find((item) => matches(item, where));
      return row ? { ...row } : null;
    },
  },
  company: { async findUnique() { return { userId: 99 }; } },
};
(globalThis as unknown as { prisma: unknown }).prisma = fake;
process.env.ASAAS_API_KEY = "synthetic-test-key-not-real";
process.env.ASAAS_API_URL = "https://asaas.invalid/v3";
process.env.ASAAS_WEBHOOK_TOKEN = "synthetic-webhook-token";

// Imported after the fake is in place (no top-level await under the CJS transform).
let claimCheckout: typeof import("../src/lib/checkout-claim").claimCheckout;
let recoverStaleCheckout: typeof import("../src/lib/checkout-claim").recoverStaleCheckout;
let adoptSubscriptionFromWebhook: typeof import("../src/lib/checkout-claim").adoptSubscriptionFromWebhook;
let webhook: typeof import("../src/app/api/webhooks/asaas/route").POST;
before(async () => {
  ({ claimCheckout, recoverStaleCheckout, adoptSubscriptionFromWebhook } = await import("../src/lib/checkout-claim"));
  ({ POST: webhook } = await import("../src/app/api/webhooks/asaas/route"));
});

type Handler = (url: string) => { status: number; body: unknown };
let asaas: Handler = () => { throw new Error("network must not be called"); };
const fetchMock = mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
  const { status, body } = asaas(String(input).replace("https://asaas.invalid/v3", ""));
  return new Response(JSON.stringify(body), { status });
});

function seed(extra: Partial<Row> = {}) {
  rows.length = 0;
  rows.push({
    id: 1, companyId: 10, provider: "local", status: "trialing", amount: 29,
    providerSubscriptionId: null, providerCustomerId: null, providerPaymentId: null, billingType: null,
    endsAt: new Date(Date.UTC(2026, 11, 1)), updatedAt: new Date(clock), ...extra,
  });
  return rows[0];
}
const later = (minutes: number) => new Date(clock + minutes * 60_000);

beforeEach(() => {
  fetchMock.mock.resetCalls();
  asaas = () => { throw new Error("network must not be called"); };
});

describe("trava de checkout Asaas", () => {
  it("só uma tentativa consegue a trava, inclusive entre Pix e cartão", async () => {
    seed();
    assert.equal(await claimCheckout(10, "PIX"), "CREATING_PIX");
    assert.equal(await claimCheckout(10, "CREDIT_CARD"), null);
    assert.equal(await claimCheckout(10, "PIX"), null);
  });

  it("não mexe em trava recente (a criação remota pode ainda estar em andamento)", async () => {
    const row = seed({ billingType: "CREATING_CARD", providerCustomerId: "cus_1" });
    assert.equal(await recoverStaleCheckout(row, later(5)), null);
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(rows[0].billingType, "CREATING_CARD");
  });

  it("libera trava antiga sem cliente salvo sem consultar o Asaas (o POST nunca começou)", async () => {
    const row = seed({ billingType: "CREATING_PIX" });
    const fresh = await recoverStaleCheckout(row, later(20));
    assert.equal(fresh?.billingType, null);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it("libera trava antiga quando o Asaas confirma que não há assinatura", async () => {
    const row = seed({ billingType: "CREATING_CARD", providerCustomerId: "cus_1" });
    asaas = (url) => {
      assert.equal(url, "/subscriptions?customer=cus_1&limit=100");
      return { status: 200, body: { data: [], hasMore: false } };
    };
    assert.equal((await recoverStaleCheckout(row, later(20)))?.billingType, null);
  });

  it("adota a assinatura existente em vez de criar outra", async () => {
    const row = seed({ billingType: "CREATING_CARD", providerCustomerId: "cus_1" });
    asaas = () => ({ status: 200, body: { data: [{ id: "sub_9", billingType: "CREDIT_CARD", deleted: false }], hasMore: false } });
    const fresh = await recoverStaleCheckout(row, later(20));
    assert.equal(fresh?.providerSubscriptionId, "sub_9");
    assert.equal(fresh?.billingType, "CREDIT_CARD");
  });

  it("mantém bloqueado quando a resposta é ambígua, paginada ou o Asaas falha", async () => {
    const cases: Handler[] = [
      () => ({ status: 200, body: { data: [{ id: "a", billingType: "CREDIT_CARD" }, { id: "b", billingType: "CREDIT_CARD" }], hasMore: false } }),
      () => ({ status: 200, body: { data: [{ id: "a", billingType: "PIX" }], hasMore: false } }),
      () => ({ status: 200, body: { data: [], hasMore: true } }),
      () => ({ status: 200, body: { data: [] } }),
      () => ({ status: 503, body: {} }),
    ];
    for (const handler of cases) {
      const row = seed({ billingType: "CREATING_CARD", providerCustomerId: "cus_1" });
      asaas = handler;
      assert.equal(await recoverStaleCheckout(row, later(20)), null);
      assert.equal(rows[0].billingType, "CREATING_CARD");
      assert.equal(rows[0].providerSubscriptionId, null);
    }
  });

  it("não libera se a linha mudou depois da leitura", async () => {
    const row = { ...seed({ billingType: "CREATING_PIX" }) };
    rows[0].updatedAt = new Date(clock + 1);
    assert.equal(await recoverStaleCheckout(row, later(20)), null);
    assert.equal(rows[0].billingType, "CREATING_PIX");
  });
});

describe("webhook antes de gravar o ID da assinatura", () => {
  it("adota só assinatura viva, do mesmo cliente e da mesma modalidade", async () => {
    seed({ billingType: "CREATING_PIX", providerCustomerId: "cus_1" });
    asaas = () => ({ status: 200, body: { id: "sub_1", customer: "cus_other", billingType: "PIX" } });
    assert.equal(await adoptSubscriptionFromWebhook("cus_1", "sub_1"), false);
    asaas = () => ({ status: 200, body: { id: "sub_1", customer: "cus_1", billingType: "CREDIT_CARD" } });
    assert.equal(await adoptSubscriptionFromWebhook("cus_1", "sub_1"), false);
    asaas = () => ({ status: 200, body: { id: "sub_1", customer: "cus_1", billingType: "PIX", deleted: true } });
    assert.equal(await adoptSubscriptionFromWebhook("cus_1", "sub_1"), false);
    assert.equal(rows[0].providerSubscriptionId, null);
  });

  it("pagamento confirmado adota a assinatura e ativa o plano pelo estado consultado no Asaas", async () => {
    seed({ billingType: "CREATING_PIX", providerCustomerId: "cus_1" });
    asaas = (url) => {
      if (url === "/payments/pay_1") return { status: 200, body: { id: "pay_1", customer: "cus_1", subscription: "sub_1", status: "RECEIVED", value: 29, dueDate: "2026-11-24" } };
      if (url === "/subscriptions/sub_1") return { status: 200, body: { id: "sub_1", customer: "cus_1", billingType: "PIX" } };
      throw new Error(`unexpected ${url}`);
    };
    const response = await webhook(new Request("http://localhost/api/webhooks/asaas", {
      method: "POST",
      headers: { "asaas-access-token": "synthetic-webhook-token" },
      // The body says PENDING on purpose: the provider's current state wins.
      body: JSON.stringify({ event: "PAYMENT_RECEIVED", payment: { id: "pay_1", status: "PENDING" } }),
    }));
    assert.equal(response.status, 200);
    assert.equal(rows[0].providerSubscriptionId, "sub_1");
    assert.equal(rows[0].billingType, "PIX");
    assert.equal(rows[0].status, "active");
    assert.equal((rows[0].endsAt as Date).toISOString(), "2026-12-29T23:59:59.999Z");
  });

  it("pagamento apagado (GET 404) é reconhecido sem travar a fila do Asaas", async () => {
    seed({ provider: "asaas", status: "trialing", providerCustomerId: "cus_1", providerSubscriptionId: "sub_1", billingType: "PIX" });
    asaas = () => ({ status: 404, body: { errors: [{ description: "not found" }] } });
    for (const event of ["PAYMENT_DELETED", "PAYMENT_UPDATED"]) {
      const response = await webhook(new Request("http://localhost/api/webhooks/asaas", {
        method: "POST",
        headers: { "asaas-access-token": "synthetic-webhook-token" },
        body: JSON.stringify({ event, payment: { id: "pay_1", customer: "cus_1", subscription: "sub_1", dueDate: "2026-11-24", value: 29 } }),
      }));
      assert.equal(response.status, 200, event);
    }
    // Trial is not cut short by a removed, unpaid charge.
    assert.equal(rows[0].status, "trialing");
  });

  it("recusa token errado e pede retry quando o Asaas está indisponível", async () => {
    seed();
    const bad = await webhook(new Request("http://localhost/api/webhooks/asaas", {
      method: "POST", headers: { "asaas-access-token": "wrong" }, body: "{}",
    }));
    assert.equal(bad.status, 401);
    asaas = () => ({ status: 503, body: {} });
    const retry = await webhook(new Request("http://localhost/api/webhooks/asaas", {
      method: "POST",
      headers: { "asaas-access-token": "synthetic-webhook-token" },
      body: JSON.stringify({ event: "PAYMENT_CONFIRMED", payment: { id: "pay_1" } }),
    }));
    assert.equal(retry.status, 503);
    assert.equal(JSON.stringify(await retry.json()).includes("synthetic"), false);
  });
});
