/* eslint-disable @typescript-eslint/no-explicit-any */
/** Audit witnesses, not product changes. Every remote/DB import is replaced by a local allowlisted fixture.
 * A passing BUG witness confirms the named undesired behavior; it does not approve production billing.
 * Run: node --import tsx --test docs/auditorias/codex-geral-2026-10-20/tests/backend-financial.test.ts
 */
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const MAIN = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const PR11 = resolve(MAIN, "../pr11");
const readset = new Set<string>();
type Module = Record<string, any>;
function load(root: string, path: string, dependencies: Module, globals: Module = {}): Module {
  const absolute = resolve(root, path); readset.add(`${root === MAIN ? "main" : "pr11"}/${path}`);
  const source = readFileSync(absolute, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const auditModule = { exports: {} };
  const sandbox = { Response, Request, Headers, URL, AbortController, AbortSignal, Buffer, console, setTimeout, clearTimeout, ...globals };
  const execute = vm.runInNewContext(`(function(require,module,exports){${output}\n})`, sandbox, { filename: absolute });
  execute((name: string) => { if (!(name in dependencies)) throw new Error(`Unmocked dependency: ${name}`); return dependencies[name]; }, auditModule, auditModule.exports);
  return auditModule.exports;
}
const gate = () => { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; };
const body = { document: "11144477735", holderName: "Fixture Holder", number: "4111111111111111", expiry: "1230", ccv: "123", postalCode: "01001000", addressNumber: "1" };
const request = (path = "cartao") => new Request(`https://audit.invalid/api/plano/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

function fixture(root = MAIN, initial: Module = {}) {
  const clock = { now: Date.parse("2026-10-20T12:00:00Z") };
  class AuditDate extends Date { constructor(value?: string | number | Date) { super(value === undefined ? clock.now : value instanceof Date ? value.getTime() : value); } static now() { return clock.now; } }
  const row: Module = { id: 1, companyId: 10, provider: "local", providerSubscriptionId: null, providerCustomerId: null, providerPaymentId: null, billingType: null, status: "past_due", startsAt: new Date("2020-01-01"), endsAt: new Date("2020-02-01"), amount: 29, ...initial };
  const company: Module = { id: 10, userId: 99, name: "Audit Fixture", email: "audit@example.invalid", whatsapp: "11999999999", phone: "11999999999", document: body.document, zipCode: body.postalCode };
  const calls = { updates: 0, card: 0, pix: 0, getPayment: 0, qr: 0, external: [] as { path: string; init?: RequestInit }[] };
  const db = {
    subscription: {
      async findUnique() { return structuredClone(row); },
      async findFirst({ where }: any) { return Object.entries(where).every(([key, value]) => row[key] === value) ? structuredClone(row) : null; },
      async update({ data }: any) { calls.updates++; for (const [key, value] of Object.entries(data)) if (value !== undefined) row[key] = value; return structuredClone(row); },
      async create({ data }: any) { Object.assign(row, data); return structuredClone(row); },
    },
    company: { async findUnique() { return structuredClone(company); }, async update({ data }: any) { Object.assign(company, data); return structuredClone(company); } },
  };
  const auth = { user: { id: 99, role: "USER", email: company.email }, company };
  const next = { NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) } };
  const globals = { Date: AuditDate, process: { env: { ASAAS_API_KEY: "audit-fake-key-never-used-remotely", ASAAS_WEBHOOK_TOKEN: "audit-fixture-token" } } };
  const constants = load(root, "src/lib/plan-constants.ts", {});
  const plans = load(root, "src/lib/plan.ts", { "next/server": next, "@/lib/admin": { isAdmin: (user: any) => user?.role === "ADMIN" }, "@/lib/company": { requireCompany: async () => auth }, "@/lib/db": { prisma: db }, "@/lib/plan-constants": constants }, globals);
  const remote = load(root, "src/lib/asaas.ts", { "@/lib/plan-constants": constants }, { ...globals, fetch: async (url: string, init?: RequestInit) => { calls.external.push({ path: url, init }); return Response.json({}); } });
  const billing = load(root, "src/lib/asaas-billing.ts", { "@/lib/db": { prisma: db }, "@/lib/asaas": remote, "@/lib/plan-constants": constants, "@/lib/plan": plans }, globals);
  const behavior: Module = {
    card: async () => ({ id: `sub_card_${calls.card}` }),
    pix: async () => ({ id: `sub_pix_${calls.pix}` }),
    first: async (id: string) => ({ id: `pay_${id}`, subscription: id, status: "PENDING", dueDate: "2026-10-20" }),
    payment: async (id: string) => ({ id, subscription: row.providerSubscriptionId, status: "CONFIRMED", dueDate: "2026-10-20" }),
    qr: async () => ({ payload: "FIXTURE_PIX", expirationDate: "2026-10-21" }),
  };
  const asaas = { ...remote, asaasConfigured: () => true, findOrCreateAsaasCustomer: async () => ({ id: "cus_fixture" }),
    createCardSubscription: async () => { calls.card++; return behavior.card(); },
    createPixSubscription: async () => { calls.pix++; return behavior.pix(); },
    firstSubscriptionPayment: (id: string) => behavior.first(id),
    getPayment: (id: string) => { calls.getPayment++; return behavior.payment(id); },
    getPixQr: (id: string) => { calls.qr++; return behavior.qr(id); },
  };
  const deps: Module = { "next/server": next, "@/lib/admin": { isAdmin: () => false }, "@/lib/company": { requireCompany: async () => auth }, "@/lib/asaas": asaas, "@/lib/asaas-billing": billing, "@/lib/db": { prisma: db }, "@/lib/document": load(root, "src/lib/document.ts", {}), "@/lib/plan": plans };
  if (root === PR11) deps["@/lib/asaas-checkout"] = load(root, "src/lib/asaas-checkout.ts", {});
  const card = load(root, "src/app/api/plano/cartao/route.ts", deps, globals);
  const pix = load(root, "src/app/api/plano/pix/route.ts", deps, globals);
  const status = load(root, "src/app/api/plano/status/route.ts", deps, globals);
  const webhook = load(root, "src/app/api/webhooks/asaas/route.ts", deps, globals);
  const event = async (payment: Module, event = "PAYMENT_CONFIRMED", id = "evt_fixture") => webhook.POST(new Request("https://audit.invalid/webhook", { method: "POST", headers: { "asaas-access-token": "audit-fixture-token", "content-type": "application/json" }, body: JSON.stringify({ id, event, payment }) }));
  return { row, company, calls, db, auth, clock, plans, remote, billing, behavior, card, pix, status, webhook, event };
}

describe("audit main vs PR11: checkout witnesses", () => {
  it("BUG main activates card subscription without any confirmed payment; PR11 preserves expired paywall", async () => {
    const main = fixture(), pr = fixture(PR11);
    assert.equal((await main.card.POST(request())).status, 200);
    assert.equal(main.row.status, "active"); assert.equal(main.plans.planView(main.row).ok, true);
    assert.equal(main.calls.getPayment, 0); assert.equal(main.row.providerPaymentId, null);
    assert.equal((await pr.card.POST(request())).status, 200);
    assert.equal(pr.row.status, "past_due"); assert.equal(pr.plans.planView(pr.row).ok, false);
  });
  for (const root of [MAIN, PR11]) {
    const label = root === MAIN ? "main" : "PR11";
    it(`BUG ${label}: concurrent card submissions create two recurring subscriptions`, async () => {
      const f = fixture(root); const reached = gate(), release = gate();
      f.behavior.card = async () => { if (f.calls.card === 2) reached.resolve(); await release.promise; return { id: `sub_created_${f.calls.card}` }; };
      const a = f.card.POST(request()), b = f.card.POST(request());
      await reached.promise; release.resolve(); const results = await Promise.all([a, b]);
      assert.ok(results.every(r => r.status === 200)); assert.equal(f.calls.card, 2);
    });
    it(`BUG ${label}: remote accepted card but response timeout leaves no local guard and retry creates again`, async () => {
      const f = fixture(root); let accepted = 0;
      f.behavior.card = async () => { accepted++; throw new Error("mock response timeout after acceptance"); };
      await f.card.POST(request()); await f.card.POST(request());
      assert.equal(accepted, 2); assert.equal(f.row.providerSubscriptionId, null);
    });
    it(`BUG ${label}: simultaneous Pix/card checkouts both create subscriptions before method guard`, async () => {
      const f = fixture(root); const reached = gate(), release = gate(); let entered = 0;
      const created = async (id: string) => { if (++entered === 2) reached.resolve(); await release.promise; return { id }; };
      f.behavior.card = () => created("sub_card"); f.behavior.pix = () => created("sub_pix");
      const a = f.card.POST(request()), b = f.pix.POST(request("pix")); await reached.promise; release.resolve();
      assert.ok((await Promise.all([a, b])).every(r => r.status === 200)); assert.equal(f.calls.card, 1); assert.equal(f.calls.pix, 1);
    });
    it(`BUG ${label}: Pix payment/QR unavailable after remote creation leaves orphan and retry creates another`, async () => {
      const f = fixture(root); f.behavior.first = async () => null;
      assert.equal((await f.pix.POST(request("pix"))).status, 502); assert.equal((await f.pix.POST(request("pix"))).status, 502);
      assert.equal(f.calls.pix, 2); assert.equal(f.row.providerSubscriptionId, null);
    });
  }
  it("PR11 sequential card retry and method switch are blocked only after identifiers are saved", async () => {
    const f = fixture(PR11); await f.card.POST(request());
    assert.equal((await f.card.POST(request())).status, 200); assert.equal(f.calls.card, 1);
    assert.equal((await f.pix.POST(request("pix"))).status, 409); assert.equal(f.calls.pix, 0);
  });
  it("BUG PR11 denied/past_due card is indefinitely pending and cannot retry or switch to Pix", async () => {
    const f = fixture(PR11, { provider: "asaas", providerSubscriptionId: "sub_denied", billingType: "CREDIT_CARD", status: "past_due" });
    const response = await f.card.POST(request()); assert.equal((await response.json()).pending, true);
    assert.equal((await f.pix.POST(request("pix"))).status, 409); assert.equal(f.calls.card, 0);
    assert.equal(f.plans.planView(f.row).ok, false);
  });
  it("PR11 canceled card may start fresh checkout, preserving canceled paywall until real confirmation", async () => {
    const f = fixture(PR11, { provider: "asaas", providerSubscriptionId: "sub_old", billingType: "CREDIT_CARD", status: "canceled" });
    assert.equal((await f.card.POST(request())).status, 200); assert.equal(f.calls.card, 1); assert.equal(f.row.status, "canceled");
  });
  it("Pix CREATED/PENDING QR never grants access, and an existing Pix subscription is reused", async () => {
    const f = fixture(PR11); await f.pix.POST(request("pix")); await f.pix.POST(request("pix"));
    assert.equal(f.calls.pix, 1); assert.equal(f.calls.qr, 2); assert.equal(f.plans.planView(f.row).ok, false);
  });
  it("BUG expired Pix QR error offers no fresh invoice path and keeps using same first payment", async () => {
    const f = fixture(PR11, { provider: "asaas", providerSubscriptionId: "sub_pix", billingType: "PIX" }); let selected = "";
    f.behavior.first = async (id: string) => { selected = id; return { id: "pay_old_expired", status: "OVERDUE" }; };
    f.behavior.qr = async () => { throw new Error("mock QR expired"); };
    assert.equal((await f.pix.POST(request("pix"))).status, 502); assert.equal(selected, "sub_pix"); assert.equal(f.calls.pix, 0);
  });
});

for (const root of [MAIN, PR11]) describe(`audit ${root === MAIN ? "main" : "PR11"}: billing/webhook state`, () => {
  const initial = { provider: "asaas", providerSubscriptionId: "sub_fixture", providerPaymentId: "pay_current", billingType: "CREDIT_CARD" };
  const paid = { id: "pay_current", subscription: "sub_fixture", customer: "cus_fixture", status: "CONFIRMED", value: 29, dueDate: "2026-10-20" };
  it("counterevidence: paid confirmation grants access, pending does not, unpaid statuses revoke it", async () => {
    const f = fixture(root, initial);
    for (const status of ["PENDING", "AWAITING_RISK_ANALYSIS", "CREDIT_CARD_CAPTURE_REFUSED"]) { await f.billing.applyAsaasPayment({ ...paid, status }); assert.equal(f.row.status, "past_due"); }
    await f.billing.applyAsaasPayment(paid); assert.equal(f.plans.planView(f.row).ok, true);
    for (const status of ["OVERDUE", "REFUNDED", "DELETED"]) { await f.billing.applyAsaasPayment({ ...paid, status }); assert.equal(f.plans.planView(f.row).ok, false); }
  });
  it("BUG event.id is ignored: duplicate confirmation writes again; without dueDate it extends entitlement", async () => {
    const f = fixture(root, initial); const payment = { ...paid, dueDate: undefined };
    await f.event(payment, "PAYMENT_CONFIRMED", "evt_same"); const end = f.row.endsAt.getTime(); const updates = f.calls.updates;
    f.clock.now += 10 * 86400000; await f.event(payment, "PAYMENT_CONFIRMED", "evt_same");
    assert.equal(f.calls.updates, updates + 1); assert.equal(f.row.endsAt.getTime() - end, 10 * 86400000);
  });
  it("counterevidence: a duplicate with the same dueDate does not extend endsAt", async () => {
    const f = fixture(root, initial); await f.event(paid); const end = f.row.endsAt.getTime();
    f.clock.now += 10 * 86400000; await f.event(paid); assert.equal(f.row.endsAt.getTime(), end);
  });
  it("BUG old overdue/deleted/refunded invoice downgrades a successfully renewed subscription", async () => {
    for (const status of ["OVERDUE", "DELETED", "REFUNDED"]) {
      const f = fixture(root, initial); await f.event({ ...paid, id: "pay_november", dueDate: "2026-11-20" });
      await f.event({ ...paid, id: "pay_september", status, dueDate: "2026-09-20" }, `PAYMENT_${status}`, "evt_old");
      assert.equal(f.plans.planView(f.row).ok, false); assert.equal(f.row.providerPaymentId, "pay_november");
    }
  });
  it("BUG old paid invoice shrinks renewal and paid replay resurrects canceled/refunded subscription", async () => {
    const f = fixture(root, initial); await f.event({ ...paid, id: "pay_new", dueDate: "2026-11-20" }); const renewedEnd = f.row.endsAt.getTime();
    await f.event({ ...paid, id: "pay_old", dueDate: "2026-09-20" }); assert.ok(f.row.endsAt.getTime() < renewedEnd);
    await f.event({ ...paid, status: "REFUNDED" }, "PAYMENT_REFUNDED"); assert.equal(f.row.status, "past_due");
    await f.event(paid, "PAYMENT_CONFIRMED", "evt_replay"); assert.equal(f.row.status, "active");
  });
  it("BUG a late confirmed invoice with dueDate over 35 days ago stays blocked despite payment", async () => {
    const f = fixture(root, initial); await f.event({ ...paid, dueDate: "2026-08-01" });
    assert.equal(f.row.status, "active"); assert.equal(f.plans.planView(f.row).ok, false);
    assert.ok(f.row.endsAt.getTime() < f.clock.now);
  });
  it("BUG webhook before local subscription ID is saved is acknowledged and lost", async () => {
    const f = fixture(root); const response = await f.event(paid);
    assert.equal(response.status, 200); assert.equal(f.row.status, "past_due"); assert.equal(f.calls.updates, 0);
    f.row.providerSubscriptionId = "sub_fixture"; assert.equal(f.row.status, "past_due");
  });
  it("BUG status fallback cannot recover pending card with no providerPaymentId", async () => {
    const f = fixture(root, { ...initial, providerPaymentId: null });
    assert.equal((await (await f.status.GET()).json()).paid, false); assert.equal(f.calls.getPayment, 0);
  });
  it("BUG chargeback statuses leave previously active access untouched", async () => {
    for (const status of ["CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE", "AWAITING_CHARGEBACK_REVERSAL"]) {
      const f = fixture(root, initial); await f.event(paid); await f.event({ ...paid, status }, "PAYMENT_CHARGEBACK_REQUESTED");
      assert.equal(f.row.status, "active"); assert.equal(f.plans.planView(f.row).ok, true);
    }
  });
  it("BUG current active-but-expired row skips provider reconciliation in status endpoint", async () => {
    const f = fixture(root, { ...initial, status: "active" });
    const response = await f.status.GET(); assert.equal((await response.json()).paid, false); assert.equal(f.calls.getPayment, 0);
  });
  it("BUG confirmed payment trusts value/customer and credits full plan for a mismatched 0.01 fixture", async () => {
    const f = fixture(root, initial); await f.event({ ...paid, value: 0.01, customer: "cus_other" });
    assert.equal(f.row.status, "active"); assert.equal(f.row.amount, 29);
  });
  it("webhook rejects absent/wrong token and returns 200 only for matching fixture token", async () => {
    const f = fixture(root, initial);
    assert.equal((await f.webhook.POST(new Request("https://audit.invalid", { method: "POST", body: "{}" }))).status, 401);
    assert.equal((await f.event(paid)).status, 200);
  });
  it("billing-exempt internal user is unaffected by payment webhook", async () => {
    const f = fixture(root, initial); f.company.userId = 1;
    await f.event(paid); assert.equal(f.calls.updates, 0); assert.equal(f.row.status, "past_due");
  });
  it("required plan returns 402 for expired unpaid account and allows confirmed plan", async () => {
    const f = fixture(root, initial); assert.equal((await f.plans.requireActivePlan()).error.status, 402);
    await f.event(paid); assert.ok(!(await f.plans.requireActivePlan()).error);
  });
  it("counterevidence: requireCompany permits authenticated expired account but budget mutations enforce 402", async () => {
    const f = fixture(root, initial);
    const next = { NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) } };
    const companyGuard = load(root, "src/lib/company.ts", { "next/server": next, "@/lib/session": { getSessionUser: async () => ({ ...f.auth.user, company: f.company }) } });
    assert.ok(!(await companyGuard.requireCompany()).error, "company/session authorization does not itself enforce payment");
    let readCalls = 0;
    const guardedDb = { ...f.db, budget: { findMany: async () => { readCalls++; return []; } } };
    const deps = { "next/server": next, "@/lib/company": companyGuard, "@/lib/plan": f.plans, "@/lib/db": { prisma: guardedDb }, "@/lib/budget": {}, "@/lib/budget-serialize": { serializeBudget: (value: unknown) => value }, "@/lib/budget-cycle": {}, "@/lib/money": {}, "@/lib/templates": {}, "@/lib/public-budget": {}, "@/lib/whatsapp": {} };
    const budgets = load(root, "src/app/api/orcamentos/route.ts", deps);
    const detail = load(root, "src/app/api/orcamentos/[id]/route.ts", deps);
    const send = load(root, "src/app/api/orcamentos/[id]/enviar/route.ts", deps);
    const context = { params: Promise.resolve({ id: "1" }) };
    assert.equal((await budgets.POST(request())).status, 402);
    assert.equal((await detail.PATCH(request(), context)).status, 402);
    assert.equal((await send.POST(request(), context)).status, 402);
    assert.equal((await budgets.GET()).status, 200); assert.equal(readCalls, 1, "existing budget read intentionally remains available");
    await f.event(paid); assert.equal((await budgets.POST(request())).status, 400, "paid request passes plan gate and reaches customer validation");
  });
  it("BUG API adapter installs no request deadline or idempotency key", async () => {
    const f = fixture(root); await f.remote.createPixSubscription("cus_fixture");
    assert.equal(f.calls.external.length, 1); const init = f.calls.external[0].init!;
    assert.equal(init.signal, undefined); assert.equal(new Headers(init.headers).has("idempotency-key"), false);
  });
});

after(() => { console.log("AUDIT_FULL_FILE_READSET", [...readset].sort().join("\n")); console.log("AUDIT_ROOT", relative(process.cwd(), MAIN)); });
