/* eslint-disable @typescript-eslint/no-explicit-any */
/** Actual-source local audit witnesses. PASS on a BUG case means the defect was reproduced.
 * All writes are bounded in-memory fixtures; mail, database and external network are never contacted.
 */
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import * as nodeCrypto from "node:crypto";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const readset = new Set<string>(); type Module = Record<string, any>;
const next = { NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) } };
function load(path: string, dependencies: Module, globals: Module = {}): Module {
  readset.add(path); const source = readFileSync(resolve(ROOT, path), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const output = { exports: {} };
  const execute = vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { Date, Request, Response, Headers, URL, TextEncoder, TextDecoder, Buffer, console, process: { env: { AUTH_SECRET: "audit-only-public-boundary-secret", NEXT_PUBLIC_APP_URL: "https://audit.invalid", NODE_ENV: "production" } }, ...globals }, { filename: resolve(ROOT, path) });
  execute((name: string) => { if (!(name in dependencies)) throw new Error(`Unmocked dependency: ${name}`); return dependencies[name]; }, output, output.exports);
  return output.exports;
}
const gate = () => { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; };
const helper = () => load("tests/helpers/fake-db.ts", {});
const publicRequest = (body: unknown) => new Request("https://audit.invalid/api/publico/fixture", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("public lead/city boundaries", () => {
  it("BUG anonymous lead modifies canonical shared city, stores 2MiB text and evicts older lead from latest-50 listing", async () => {
    const { table } = helper(); const cityTable = table(), leads = table(); let writes = 0;
    const canonical = await cityTable.create({ data: { stateId: 35, name: "São Paulo", slug: "sao-paulo" } });
    const legitimateId = 999;
    leads.rows.push({ id: legitimateId, companyId: 10, customerName: "Legitimate fixture", customerPhone: "1100000000", description: "Existing lead", createdAt: new Date("2026-01-01") });
    const create = leads.create;
    leads.create = async ({ data }: any) => { writes++; return create({ data: { ...data, createdAt: new Date(Date.parse("2026-10-20") + writes) } }); };
    const db = { city: cityTable, quoteRequest: leads, company: { findUnique: async ({ where }: any) => where.slug === "fixture" ? { id: 10, cityId: canonical.id } : null }, state: { findUnique: async ({ where }: any) => where.id === 35 ? { id: 35, uf: "SP" } : null } };
    const text = load("src/lib/text.ts", {});
    const city = load("src/lib/city.ts", { "@/lib/db": { prisma: db }, "@/lib/text": text });
    const lead = load("src/app/api/publico/empresas/[slug]/pedir/route.ts", { "next/server": next, "@/lib/db": { prisma: db }, "@/lib/city": city, "@/lib/whatsapp": { digitsOnly: (value: string) => value.replace(/\D/g, "") } });
    const list = load("src/app/api/pedidos/route.ts", { "next/server": next, "@/lib/db": { prisma: db }, "@/lib/company": { requireCompany: async () => ({ user: { id: 99 }, company: { id: 10 } }) } });
    const context = { params: Promise.resolve({ slug: "fixture" }) };
    const maliciousCity = "S\u0303a\u0301o\u0300 Pau\u0301lo\u0302";
    assert.equal(text.slugify(maliciousCity), "sao-paulo"); assert.ok(text.accentCount(maliciousCity) > text.accentCount("São Paulo"));
    const input = { customerName: "Anonymous fixture", customerPhone: "11999999999", stateId: 35, cityName: maliciousCity, description: "X".repeat(2 * 1024 * 1024) };
    const response = await lead.POST(publicRequest(input), context);
    assert.equal(response.status, 200); assert.equal(cityTable.rows.length, 1);
    assert.equal(cityTable.rows[0].id, canonical.id); assert.notEqual(cityTable.rows[0].name, "São Paulo");
    assert.equal(cityTable.rows[0].name, text.titleCaseName(maliciousCity));
    assert.equal(leads.rows.at(-1).description.length, 2 * 1024 * 1024);
    for (let n = 0; n < 50; n++) assert.equal((await lead.POST(publicRequest({ ...input, description: "Repeated fixture" }), context)).status, 200);
    assert.equal(writes, 51); assert.equal(leads.rows.length, 52);
    const latest = await (await list.GET()).json();
    assert.equal(latest.length, 50); assert.ok(latest.every((row: Module) => row.id !== legitimateId));
    assert.ok(leads.rows.some((row: Module) => row.id === legitimateId), "old data still exists; defect is loss from an unpaginated listing, not deletion");
  });
  it("counterevidence: unavailable company/state reject before lead write", async () => {
    let writes = 0;
    const db = { company: { findUnique: async ({ where }: any) => where.slug === "fixture" ? { id: 10 } : null }, state: { findUnique: async () => null }, quoteRequest: { create: async () => { writes++; } } };
    const route = load("src/app/api/publico/empresas/[slug]/pedir/route.ts", { "next/server": next, "@/lib/db": { prisma: db }, "@/lib/city": { findOrCreateCity: async () => { throw new Error("should not reach city"); } }, "@/lib/whatsapp": { digitsOnly: (value: string) => value.replace(/\D/g, "") } });
    const body = { customerName: "Fixture", customerPhone: "11999999999", stateId: 99999 };
    assert.equal((await route.POST(publicRequest(body), { params: Promise.resolve({ slug: "missing" }) })).status, 404);
    assert.equal((await route.POST(publicRequest(body), { params: Promise.resolve({ slug: "fixture" }) })).status, 400);
    assert.equal(writes, 0);
  });
});

function budgetFixture(concurrent = true) {
  const row: Module = { id: 1, publicToken: "public-fixture-token", companyId: 10, status: "sent", validityDate: null, viewedAt: null, approvedAt: null, rejectedAt: null };
  const events: Module[] = [], updates: Module[] = []; const bothRead = gate(), releaseReads = gate(), approvedLogged = gate(); let reads = 0;
  const db = {
    budget: {
      async findUnique({ where }: any) { if (where.publicToken !== row.publicToken) return null; const snapshot = structuredClone(row); if (concurrent) { if (++reads === 2) bothRead.resolve(); await releaseReads.promise; } return snapshot; },
      async update({ where, data }: any) { updates.push({ where, data }); if (concurrent && data.status !== "approved") await approvedLogged.promise; Object.assign(row, data); return structuredClone(row); },
    },
    budgetEvent: { async create({ data }: any) { events.push(data); if (data.event === "approved") approvedLogged.resolve(); return data; } },
  };
  const http = load("src/lib/http.ts", {});
  const publicBudget = load("src/lib/public-budget.ts", { "@prisma/client": {}, "@/lib/db": { prisma: db }, "@/lib/http": http });
  const cycle = load("src/lib/budget-cycle.ts", {});
  const deps = { "next/server": next, "@/lib/db": { prisma: db }, "@/lib/public-budget": publicBudget, "@/lib/budget-cycle": cycle, "@/lib/session": { getSessionUser: async () => null } };
  const respond = load("src/app/api/publico/orcamentos/[token]/responder/route.ts", deps), view = load("src/app/api/publico/orcamentos/[token]/visualizar/route.ts", deps);
  const context = { params: Promise.resolve({ token: row.publicToken }) };
  return { row, events, updates, bothRead, releaseReads, respond, view, context };
}

describe("public budget transition races", () => {
  for (const competing of ["revision", "reject", "view"] as const) {
    it(`BUG simultaneous approve then ${competing} overwrites terminal approval and records contradictory events`, async () => {
      const f = budgetFixture();
      const approval = f.respond.POST(publicRequest({ action: "approve" }), f.context);
      const competitor = competing === "view" ? f.view.POST(publicRequest({}), f.context) : f.respond.POST(publicRequest({ action: competing, reason: "outro", message: "Fixture adjustment" }), f.context);
      await f.bothRead.promise; f.releaseReads.resolve();
      const responses = await Promise.all([approval, competitor]); assert.ok(responses.every(response => response.status === 200));
      assert.equal(f.row.status, competing === "revision" ? "waiting" : competing === "reject" ? "rejected" : "viewed");
      assert.ok(f.row.approvedAt); assert.equal(f.events[0].event, "approved"); assert.equal(f.events[1].event, competing === "revision" ? "revision_requested" : competing === "reject" ? "rejected" : "viewed");
      assert.ok(f.updates.every(update => Object.keys(update.where).join() === "id"), "writes contain no expected-status/version guard");
    });
  }
  it("counterevidence: sequential response after approval is rejected and sequential view keeps approval", async () => {
    const f = budgetFixture(false); assert.equal((await f.respond.POST(publicRequest({ action: "approve" }), f.context)).status, 200);
    assert.equal((await f.respond.POST(publicRequest({ action: "revision", message: "Fixture adjustment" }), f.context)).status, 409);
    assert.equal((await f.view.POST(publicRequest({}), f.context)).status, 200);
    assert.equal(f.row.status, "approved"); assert.equal(f.events.length, 1);
  });
});

function loginFixture() {
  const { table, withTransaction } = helper();
  const db = withTransaction({ authAttempt: table(), passwordResetToken: table({ usedAt: null }), user: table(), company: table() });
  const cookies = new Map<string, string>(), writes: Module[] = [];
  const jar = { get: (key: string) => cookies.has(key) ? { value: cookies.get(key) } : undefined, set: (key: string, value: string, options: Module) => { cookies.set(key, value); writes.push({ key, options }); }, delete: (key: string) => cookies.delete(key) };
  const urls = load("src/lib/urls.ts", {}), rules = load("src/lib/password-rules.ts", {});
  const password = load("src/lib/password.ts", { bcryptjs: bcrypt, "@/lib/password-rules": rules });
  const security = load("src/lib/auth-security.ts", { crypto: nodeCrypto });
  const reset = load("src/lib/password-reset.ts", { "@/lib/db": { prisma: db }, "@/lib/auth-security": security, "@/lib/password": password, "@/lib/resend": { resendIsConfigured: () => false }, "@/lib/urls": urls });
  const login = load("src/lib/auth-login.ts", { "@/lib/db": { prisma: db }, "@/lib/auth-security": security, "@/lib/password": password, "@/lib/password-reset": reset });
  const tokens = load("src/lib/session-token.ts", { jose, "@/lib/urls": urls });
  const session = load("src/lib/session.ts", { "next/headers": { cookies: async () => jar }, "@/lib/db": { prisma: db }, "@/lib/session-token": tokens });
  const route = load("src/app/api/auth/login/route.ts", { "next/server": next, "@/lib/auth-login": login, "@/lib/session": session, "@/lib/urls": urls });
  return { db, cookies, writes, password, tokens, route };
}

describe("login form content/origin boundary", () => {
  it("BUG cross-site text/plain HTML-form-compatible JSON authenticates and issues a session", async () => {
    const f = loginFixture(); const email = "attacker@example.invalid", password = "Attacker123!";
    const account = await f.db.user.create({ data: { email, passwordHash: await f.password.hashPassword(password), emailVerifiedAt: new Date() } });
    const name = `{"email":"${email}","password":"${password}","ignored":"`, value = '"}';
    const encoded = `${name}=${value}\r\n`; assert.equal(JSON.parse(encoded).ignored, "=", "text/plain form serializes name=value CRLF and remains valid JSON");
    const response = await f.route.POST(new Request("https://audit.invalid/api/auth/login", { method: "POST", headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site", "content-type": "text/plain" }, body: encoded }));
    assert.equal(response.status, 200); assert.equal((await response.json()).ok, true);
    assert.equal((await f.tokens.readSessionToken(f.cookies.get("orcah_session"))).userId, account.id);
    assert.equal(f.writes[0].options.sameSite, "lax"); assert.equal(f.writes[0].options.httpOnly, true);
  });
  it("counterevidence: same-origin valid login works and wrong password does not issue a cookie", async () => {
    const f = loginFixture(); await f.db.user.create({ data: { email: "verified@example.invalid", passwordHash: await f.password.hashPassword("Correct123!"), emailVerifiedAt: new Date() } });
    const sameOrigin = (password: string) => new Request("https://audit.invalid/api/auth/login", { method: "POST", headers: { origin: "https://audit.invalid", "content-type": "application/json" }, body: JSON.stringify({ email: "verified@example.invalid", password }) });
    assert.equal((await f.route.POST(sameOrigin("Wrong123!"))).status, 401); assert.equal(f.writes.length, 0);
    assert.equal((await f.route.POST(sameOrigin("Correct123!"))).status, 200); assert.equal(f.writes.length, 1);
  });
});

after(() => console.log("AUDIT_PUBLIC_BOUNDARIES_FULL_FILE_READSET", [...readset].sort().join("\n")));
