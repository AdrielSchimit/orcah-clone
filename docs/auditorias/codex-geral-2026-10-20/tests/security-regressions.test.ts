/* eslint-disable @typescript-eslint/no-explicit-any */
/** Local audit witnesses. BUG tests assert observed defects, not desired behavior.
 * Actual source is transpiled and executed with allowlisted DB, mail, cookie and Cache API fixtures.
 * No browser, database connection, email service or external request is used.
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
const readset = new Set<string>();
const SECRET = "audit-only-auth-secret-never-a-production-credential";
type Module = Record<string, any>;
const next = { NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init), redirect: (url: string) => Response.redirect(url) } };
function source(path: string) { readset.add(path); return readFileSync(resolve(ROOT, path), "utf8"); }
function load(path: string, dependencies: Module, globals: Module = {}): Module {
  const code = ts.transpileModule(source(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const output = { exports: {} };
  const execute = vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { Date, Request, Response, Headers, URL, TextEncoder, TextDecoder, Buffer, console, process: { env: { AUTH_SECRET: SECRET, NEXT_PUBLIC_APP_URL: "https://audit.invalid", NODE_ENV: "test" } }, ...globals }, { filename: resolve(ROOT, path) });
  execute((name: string) => { if (!(name in dependencies)) throw new Error(`Unmocked dependency: ${name}`); return dependencies[name]; }, output, output.exports);
  return output.exports;
}
function authFixture() {
  const { table, withTransaction } = load("tests/helpers/fake-db.ts", {});
  const db = withTransaction({ authAttempt: table(), emailVerificationToken: table({ usedAt: null }), passwordResetToken: table({ usedAt: null }), user: table({ emailVerifiedAt: null, passwordChangedAt: null }), company: table() });
  const cookies = new Map<string, string>(); const cookieWrites: Module[] = [];
  const jar = { get: (key: string) => cookies.has(key) ? { value: cookies.get(key) } : undefined, set: (key: string, value: string, options: Module) => { cookies.set(key, value); cookieWrites.push({ key, value, options }); }, delete: (key: string) => cookies.delete(key) };
  const sent: { email: string; link: string }[] = [];
  const mail = { resendIsConfigured: () => true, sendVerificationEmail: async (message: { email: string; link: string }) => { sent.push(message); }, sendPasswordResetEmail: async (message: { email: string; link: string }) => { sent.push(message); } };
  const urls = load("src/lib/urls.ts", {});
  const rules = load("src/lib/password-rules.ts", {});
  const password = load("src/lib/password.ts", { bcryptjs: bcrypt, "@/lib/password-rules": rules });
  const security = load("src/lib/auth-security.ts", { crypto: nodeCrypto });
  const deps: Module = { "@/lib/db": { prisma: db }, "@/lib/urls": urls, "@/lib/auth-security": security, "@/lib/password": password, "@/lib/password-rules": rules, "@/lib/resend": mail };
  const reset = load("src/lib/password-reset.ts", deps);
  deps["@/lib/password-reset"] = reset;
  const verification = load("src/lib/email-verification.ts", deps);
  deps["@/lib/email-verification"] = verification;
  const registration = load("src/lib/registration.ts", deps);
  const login = load("src/lib/auth-login.ts", deps);
  const tokens = load("src/lib/session-token.ts", { jose, "@/lib/urls": urls });
  const session = load("src/lib/session.ts", { "next/headers": { cookies: async () => jar }, "@/lib/db": { prisma: db }, "@/lib/session-token": tokens });
  const verifyRoute = load("src/app/api/auth/verificar-email/route.ts", { "next/server": next, "@/lib/db": { prisma: db }, "@/lib/email-verification": verification, "@/lib/session": session, "@/lib/urls": urls });
  const logout = load("src/app/api/auth/logout/route.ts", { "next/server": next, "@/lib/session": session, "@/lib/urls": urls });
  return { db, cookies, cookieWrites, sent, password, registration, verification, login, tokens, session, verifyRoute, logout };
}

describe("security audit: pre-registration credentials", () => {
  it("BUG verification after victim re-registers preserves attacker password and creates victim session", async () => {
    const f = authFixture(), now = new Date();
    const email = "victim@example.invalid", attackerPassword = "Attacker123!", victimPassword = "Victim456!";
    const register = (name: string, password: string, ip: string) => f.registration.registerUser({ body: { name, email, password }, headers: new Headers({ "x-forwarded-for": ip }), now, db: f.db });
    assert.equal((await register("Attacker pre-registration", attackerPassword, "192.0.2.1")).ok, true);
    const originalHash = f.db.user.rows[0].passwordHash;
    const beforeVerify = await f.login.authenticateLogin({ email, password: attackerPassword, headers: new Headers(), now, db: f.db });
    assert.equal(beforeVerify.status, 403, "counterevidence: attacker cannot log in before mailbox verification");
    assert.equal((await register("Victim registration", victimPassword, "192.0.2.2")).ok, true);
    assert.equal(f.db.user.rows.length, 1); assert.equal(f.db.user.rows[0].passwordHash, originalHash);
    const token = new URL(f.sent.at(-1)!.link).searchParams.get("token"); assert.ok(token);
    const verified = await f.verifyRoute.POST(new Request("https://audit.invalid/api/auth/verificar-email", { method: "POST", body: JSON.stringify({ token }) }));
    assert.equal(verified.status, 200); assert.ok(f.cookies.get("orcah_session"), "actual verification route creates a session");
    assert.ok(f.db.user.rows[0].emailVerifiedAt);
    const attacker = await f.login.authenticateLogin({ email, password: attackerPassword, headers: new Headers(), now, db: f.db });
    const victim = await f.login.authenticateLogin({ email, password: victimPassword, headers: new Headers(), now, db: f.db });
    assert.equal(attacker.ok, true); assert.equal(victim.ok, false); assert.equal(victim.status, 401);
    assert.equal((await f.session.getSessionUser()).id, f.db.user.rows[0].id);
    assert.equal(f.sent.length, 2, "both links remain local mock mail deliveries");
  });
  it("counterevidence: an already verified email rejects another registration and retains its credentials", async () => {
    const f = authFixture(); await f.db.user.create({ data: { email: "verified@example.invalid", name: "Verified", emailVerifiedAt: new Date(), passwordHash: await f.password.hashPassword("Original123!") } });
    const result = await f.registration.registerUser({ body: { name: "Other", email: "verified@example.invalid", password: "Changed123!" }, headers: new Headers(), db: f.db });
    assert.equal(result.status, 409); assert.equal(await f.password.verifyPassword("Original123!", f.db.user.rows[0].passwordHash), true);
    assert.equal(f.sent.length, 0);
  });
});

function workerFixture() {
  const events: Module = {}, stores = new Map<string, Map<string, Response>>(); let online = true;
  const key = (input: Request | string) => typeof input === "string" ? new URL(input, "https://audit.invalid").href : input.url;
  const caches = {
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map()); const store = stores.get(name)!;
      return { put: async (request: Request | string, response: Response) => { store.set(key(request), response.clone()); }, addAll: async () => undefined };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name: string) { return stores.delete(name); },
    async match(request: Request | string) { for (const store of stores.values()) { const found = store.get(key(request)); if (found) return found.clone(); } return undefined; },
  };
  const self = { location: { origin: "https://audit.invalid" }, addEventListener: (name: string, callback: any) => { events[name] = callback; }, skipWaiting: async () => undefined, clients: { claim: async () => undefined } };
  vm.runInNewContext(source("public/sw.js"), { self, caches, URL, fetch: async (request: Request) => {
    if (!online) throw new Error("mock offline");
    const isRsc = request.headers.get("RSC") === "1";
    return new Response(isRsc ? "0:PRIVATE_BUDGET_RSC_CONTACT" : "<html>PRIVATE_BUDGET_CLIENT_CONTACT</html>", { headers: { "content-type": isRsc ? "text/x-component" : "text/html", "cache-control": "private, no-store, max-age=0", vary: "RSC, Next-Router-State-Tree, Next-Router-Prefetch" } });
  } }, { filename: resolve(ROOT, "public/sw.js") });
  const fetchEvent = async (url: string, init?: RequestInit) => {
    let pending: Promise<Response> | undefined;
    events.fetch({ request: new Request(url, init), respondWith: (response: Promise<Response>) => { pending = response; } });
    const response = pending ? await pending : undefined;
    await new Promise<void>(done => setImmediate(done)); // complete SW's detached cache.put promise
    return response;
  };
  return { stores, caches, fetchEvent, offline: () => { online = false; } };
}

describe("security audit: service worker cache", () => {
  for (const [path, rsc] of [["/painel", false], ["/painel/orcamentos/7", false], ["/painel?_rsc=fixture", true]] as const) {
    it(`BUG authenticated no-store ${rsc ? "RSC" : "HTML"} ${path} survives logout and is served offline`, async () => {
      const worker = workerFixture(), auth = authFixture();
      await auth.session.createSession(99); assert.ok(auth.cookies.get("orcah_session"));
      const url = `https://audit.invalid${path}`, init = rsc ? { headers: { RSC: "1" } } : undefined;
      const online = await worker.fetchEvent(url, init); assert.ok(online);
      assert.match(online.headers.get("cache-control")!, /no-store/);
      const original = await online.text(); assert.match(original, /PRIVATE_BUDGET/);
      assert.ok(await worker.caches.match(new Request(url, init)), "explicit Cache API stored private no-store response");
      assert.equal((await auth.logout.POST()).status, 200); assert.equal(auth.cookies.has("orcah_session"), false);
      worker.offline(); const loggedOut = await worker.fetchEvent(url, init);
      assert.equal(await loggedOut!.text(), original, "same browser/origin retains protected content without a session or network");
    });
  }
  it("counterevidence: API, non-GET and cross-origin requests are not intercepted", async () => {
    const worker = workerFixture();
    assert.equal(await worker.fetchEvent("https://audit.invalid/api/orcamentos"), undefined);
    assert.equal(await worker.fetchEvent("https://audit.invalid/painel", { method: "POST" }), undefined);
    assert.equal(await worker.fetchEvent("https://other.invalid/painel"), undefined);
    assert.equal(worker.stores.size, 0);
  });
  it("actual PwaRegister registers root worker without checking authentication or environment", async () => {
    const registered: string[] = [];
    const pwa = load("src/components/pwa-register.tsx", { react: { useEffect: (effect: () => void) => effect() } }, { navigator: { serviceWorker: { register: async (path: string) => { registered.push(path); } } } });
    pwa.PwaRegister(); assert.deepEqual(registered, ["/sw.js"]);
    assert.match(source("src/app/layout.tsx"), /<PwaRegister\s*\/>/, "root layout mounts the actual registration component");
  });
});

describe("security audit: session boundaries", () => {
  it("BUG old JWT issued in password-change second remains accepted by actual getSessionUser", async () => {
    const f = authFixture(); const issued = Math.floor(Date.now() / 1000) - 60;
    const changedAt = new Date(issued * 1000 + 900);
    const user = await f.db.user.create({ data: { email: "session@example.invalid", emailVerifiedAt: new Date(), passwordChangedAt: changedAt } });
    const token = await new jose.SignJWT({ userId: user.id }).setProtectedHeader({ alg: "HS256" }).setIssuedAt(issued).setExpirationTime(issued + 3600).sign(new TextEncoder().encode(SECRET));
    f.cookies.set("orcah_session", token);
    assert.equal(f.tokens.sessionIsCurrent(issued, changedAt), true);
    assert.equal((await f.session.getSessionUser()).id, user.id);
    assert.equal(f.tokens.sessionIsCurrent(issued - 1, changedAt), false, "counterevidence: earlier complete seconds are revoked");
  });
  it("purpose confusion: actual session decoder accepts handoff token; actual JWT expiry still caps lifetime to two minutes", async () => {
    const f = authFixture(); const token = await f.tokens.signHandoffToken(99);
    assert.equal((await f.tokens.readHandoffToken(token)), 99);
    assert.equal((await f.tokens.readSessionToken(token)).userId, 99);
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(SECRET));
    assert.equal(payload.purpose, "handoff"); assert.equal(payload.exp! - payload.iat!, 120);
    assert.equal(f.tokens.sessionCookieOptions().maxAge, 30 * 86400);
    await assert.rejects(jose.jwtVerify(token, new TextEncoder().encode(SECRET), { currentDate: new Date((payload.exp! + 1) * 1000) }), { code: "ERR_JWT_EXPIRED" });
  });
});

after(() => console.log("AUDIT_SECURITY_FULL_FILE_READSET", [...readset].sort().join("\n")));
