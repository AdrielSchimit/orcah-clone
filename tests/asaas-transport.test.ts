import assert from "node:assert/strict";
import { test } from "node:test";
import { AsaasHttpError, asaasErrorMessage, asaasRejectedRequest, getPayment, getPixQr, listCustomerSubscriptions, listSubscriptionPayments } from "../src/lib/asaas";

test("Asaas transport uses encoded identifiers, no redirect and a timeout", async t => {
  const oldKey = process.env.ASAAS_API_KEY;
  const oldUrl = process.env.ASAAS_API_URL;
  process.env.ASAAS_API_KEY = "synthetic-test-key";
  process.env.ASAAS_API_URL = "https://asaas.invalid/v3";
  t.after(() => { if (oldKey === undefined) delete process.env.ASAAS_API_KEY; else process.env.ASAAS_API_KEY = oldKey; if (oldUrl === undefined) delete process.env.ASAAS_API_URL; else process.env.ASAAS_API_URL = oldUrl; });
  const mock = t.mock.method(globalThis, "fetch", async () => new Response('{"id":"fake"}', { status: 200 }));
  await getPayment("id/with?characters");
  await getPixQr("id/with?characters");
  assert.equal(mock.mock.calls[0].arguments[0], "https://asaas.invalid/v3/payments/id%2Fwith%3Fcharacters");
  assert.equal(mock.mock.calls[1].arguments[0], "https://asaas.invalid/v3/payments/id%2Fwith%3Fcharacters/pixQrCode");
  const init = mock.mock.calls[0].arguments[1];
  assert.equal(init?.redirect, "error");
  assert.ok(init?.signal instanceof AbortSignal);
  assert.equal(init?.cache, "no-store");
});
test("provider error body tolerates null and primitive values", () => { for (const body of [null, undefined, 1, "oops"]) assert.equal(asaasErrorMessage(body, "fallback"), "fallback"); });
test("Asaas errors keep the HTTP status; only definitive refusals count as rejected", async (t) => {
  const oldKey = process.env.ASAAS_API_KEY;
  process.env.ASAAS_API_KEY = "synthetic-test-key";
  t.after(() => { if (oldKey === undefined) delete process.env.ASAAS_API_KEY; else process.env.ASAAS_API_KEY = oldKey; });
  for (const [status, body, rejected] of [[400, '{"errors":[{"description":"recusado"}]}', true], [404, "{}", true], [429, "{}", true], [500, "{}", false], [502, "<html>bad gateway</html>", false]] as const) {
    t.mock.method(globalThis, "fetch", async () => new Response(body, { status }));
    const error = await getPayment("pay_1").then(() => null, (caught: unknown) => caught);
    assert.ok(error instanceof AsaasHttpError, String(status));
    assert.equal((error as AsaasHttpError).status, status);
    assert.equal(asaasRejectedRequest(error), rejected, String(status));
    t.mock.restoreAll();
  }
  assert.equal(asaasRejectedRequest(new Error("timeout")), false);
  assert.equal(asaasRejectedRequest(new DOMException("aborted", "TimeoutError")), false);
});
test("listings encode ids and report incomplete pages", async (t) => {
  const oldKey = process.env.ASAAS_API_KEY;
  const oldUrl = process.env.ASAAS_API_URL;
  process.env.ASAAS_API_KEY = "synthetic-test-key";
  process.env.ASAAS_API_URL = "https://asaas.invalid/v3";
  t.after(() => { if (oldKey === undefined) delete process.env.ASAAS_API_KEY; else process.env.ASAAS_API_KEY = oldKey; if (oldUrl === undefined) delete process.env.ASAAS_API_URL; else process.env.ASAAS_API_URL = oldUrl; });
  const mock = t.mock.method(globalThis, "fetch", async () => new Response('{"data":[{"id":"x"}],"hasMore":true}', { status: 200 }));
  const subs = await listCustomerSubscriptions("cus&x=1");
  const pays = await listSubscriptionPayments("sub/1");
  assert.equal(mock.mock.calls[0].arguments[0], "https://asaas.invalid/v3/subscriptions?customer=cus%26x%3D1&limit=100");
  assert.equal(mock.mock.calls[1].arguments[0], "https://asaas.invalid/v3/payments?subscription=sub%2F1&limit=100");
  assert.equal(subs.complete, false);
  assert.equal(pays.items.length, 1);
});
