import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

/**
 * In-memory stand-ins for prisma.asaasWebhookEvent / prisma.subscription, injected through globalThis.prisma
 * (src/lib/db.ts reuses it outside production). Asaas is reached only through a mocked fetch.
 * Checks the event ledger logic; it is NOT a concurrency test against PostgreSQL.
 */
type EventRow = {
  id: string;
  event: string;
  paymentId: string | null;
  subscriptionId: string | null;
  attempts: number;
  processedAt: Date | null;
  lastError: string | null;
};
const events = new Map<string, EventRow>();
let createFailure: unknown = null;
let subscriptionWrites = 0;

const fake = {
  asaasWebhookEvent: {
    async create({ data }: { data: Omit<EventRow, "attempts" | "processedAt" | "lastError"> }) {
      if (createFailure) throw createFailure;
      if (events.has(data.id)) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
      const row = { ...data, attempts: 1, processedAt: null, lastError: null };
      events.set(data.id, row);
      return { ...row };
    },
    async findUnique({ where }: { where: { id: string } }) {
      const row = events.get(where.id);
      return row ? { ...row } : null;
    },
    async updateMany({ where, data }: { where: { id: string; processedAt: null }; data: Record<string, unknown> }) {
      const row = events.get(where.id);
      if (!row || row.processedAt !== null) return { count: 0 };
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === "object" && "increment" in value) {
          (row as Record<string, unknown>)[key] = (row[key as keyof EventRow] as number) + (value.increment as number);
        } else {
          (row as Record<string, unknown>)[key] = value;
        }
      }
      return { count: 1 };
    },
  },
  subscription: {
    async updateMany() {
      subscriptionWrites += 1;
      return { count: 1 };
    },
  },
};
(globalThis as unknown as { prisma: unknown }).prisma = fake;
process.env.ASAAS_API_KEY = "synthetic-test-key-not-real";
process.env.ASAAS_API_URL = "https://asaas.invalid/v3";
process.env.ASAAS_WEBHOOK_TOKEN = "synthetic-webhook-token";

let webhook: typeof import("../src/app/api/webhooks/asaas/route").POST;
let ledger: typeof import("../src/lib/asaas-webhook-ledger");
let AsaasHttpError: typeof import("../src/lib/asaas").AsaasHttpError;
before(async () => {
  ({ POST: webhook } = await import("../src/app/api/webhooks/asaas/route"));
  ledger = await import("../src/lib/asaas-webhook-ledger");
  ({ AsaasHttpError } = await import("../src/lib/asaas"));
});

let asaasStatus = 404;
const fetchMock = mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ errors: [] }), { status: asaasStatus }));

function deliver(body: Record<string, unknown>) {
  return webhook(new Request("http://localhost/api/webhooks/asaas", {
    method: "POST",
    headers: { "asaas-access-token": "synthetic-webhook-token", "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}
const paymentEvent = (id?: unknown) => ({ ...(id === undefined ? {} : { id }), event: "PAYMENT_RECEIVED", payment: { id: "pay_1", subscription: "sub_1" } });
const deletedEvent = (id: string) => ({ id, event: "SUBSCRIPTION_DELETED", subscription: { id: "sub_1" } });

beforeEach(() => {
  events.clear();
  createFailure = null;
  subscriptionWrites = 0;
  asaasStatus = 404;
  fetchMock.mock.resetCalls();
});

describe("registro de eventos do webhook Asaas", () => {
  it("processa o evento uma vez e reconhece a reentrega sem aplicar de novo", async () => {
    const first = await deliver(deletedEvent("evt_abc&1"));
    assert.equal(first.status, 200);
    assert.equal(subscriptionWrites, 1);
    const row = events.get("evt_abc&1");
    assert.ok(row?.processedAt);
    assert.equal(row.event, "SUBSCRIPTION_DELETED");
    assert.equal(row.subscriptionId, "sub_1");

    const again = await deliver(deletedEvent("evt_abc&1"));
    assert.equal(again.status, 200);
    assert.deepEqual(await again.json(), { ok: true, duplicate: true });
    assert.equal(subscriptionWrites, 1);
  });

  it("reentrega de evento de pagamento já processado não consulta o Asaas", async () => {
    assert.equal((await deliver(paymentEvent("evt_pay&1"))).status, 200);
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(events.get("evt_pay&1")?.paymentId, "pay_1");
    assert.equal((await deliver(paymentEvent("evt_pay&1"))).status, 200);
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  it("falha temporária fica registrada sem dados do pagamento e a reentrega processa", async () => {
    asaasStatus = 503;
    const failed = await deliver(paymentEvent("evt_retry&1"));
    assert.equal(failed.status, 503);
    let row = events.get("evt_retry&1");
    assert.equal(row?.processedAt, null);
    assert.equal(row?.lastError, "asaas_503");

    asaasStatus = 404;
    const retried = await deliver(paymentEvent("evt_retry&1"));
    assert.equal(retried.status, 200);
    row = events.get("evt_retry&1");
    assert.equal(row?.attempts, 2);
    assert.ok(row?.processedAt);
    assert.equal(row?.lastError, null);
  });

  it("evento sem id utilizável é processado mas não registrado", async () => {
    for (const id of [undefined, "", "evt com espaço", "x".repeat(121), 42]) {
      assert.equal((await deliver(paymentEvent(id))).status, 200);
    }
    assert.equal(events.size, 0);
    assert.equal(fetchMock.mock.callCount(), 5);
  });

  it("tabela ainda não migrada não pausa a fila: processa sem registro", async () => {
    createFailure = Object.assign(new Error("The table does not exist"), { code: "P2021" });
    const response = await deliver(deletedEvent("evt_nomigration&1"));
    assert.equal(response.status, 200);
    assert.equal(subscriptionWrites, 1);
    assert.equal(events.size, 0);
  });

  it("banco indisponível no registro pede reentrega sem consultar o Asaas", async () => {
    createFailure = Object.assign(new Error("Can't reach database"), { code: "P1001" });
    const response = await deliver(paymentEvent("evt_dbdown&1"));
    assert.equal(response.status, 503);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it("entrega concorrente ainda não concluída é tratada como nova tentativa", async () => {
    events.set("evt_race&1", { id: "evt_race&1", event: "PAYMENT_RECEIVED", paymentId: "pay_1", subscriptionId: null, attempts: 1, processedAt: null, lastError: null });
    assert.equal(await ledger.beginWebhookEvent({ id: "evt_race&1", event: "PAYMENT_RECEIVED" }), "retry");
    assert.equal(events.get("evt_race&1")?.attempts, 2);
  });

  it("código de erro nunca copia a mensagem original", () => {
    const leaky = new Error("cpfCnpj 12345678900 card 4111111111111111");
    assert.equal(ledger.webhookErrorCode(leaky), "error");
    assert.equal(ledger.webhookErrorCode(new AsaasHttpError(429, "Too many")), "asaas_429");
    assert.equal(ledger.webhookErrorCode(Object.assign(new Error("x"), { code: "P2034" })), "db_P2034");
    assert.equal(ledger.webhookErrorCode(Object.assign(new Error("x"), { code: "4111111111111111" })), "error");
  });

  it("aceita o formato de id do Asaas e recusa o resto", () => {
    assert.equal(ledger.webhookEventId("evt_05b708f961d739ea7eba7e4db318f621&368604920"), "evt_05b708f961d739ea7eba7e4db318f621&368604920");
    assert.equal(ledger.webhookEventId("evt\n1"), null);
    assert.equal(ledger.webhookEventId({ id: "evt_1" }), null);
  });
});
