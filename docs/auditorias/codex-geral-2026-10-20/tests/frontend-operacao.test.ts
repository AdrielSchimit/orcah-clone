/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */
// Dynamic JS/DOM fixtures intentionally use heterogeneous values and callbacks.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import vm from "node:vm";

// Offline audit harness: every dependency is stubbed or loaded from the inspected
// local installation. No application server, database or external network exists.
const main = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const audit = dirname(main);
const localRequire = createRequire(resolve(main, "package.json"));
const ts = localRequire("typescript");
const read = (repo: string, path: string) => readFileSync(resolve(audit, repo, path), "utf8");
const deniedFetch = () => { throw new Error("NETWORK DENIED BY AUDIT HARNESS"); };
function loadTS(repo: string, path: string, stubs: Record<string, unknown> = {}, extras = {}) {
  const exports = {};
  const context = vm.createContext({ exports, module: { exports }, console, Buffer, Response, Request, File, FormData,
    URL, AbortSignal, TextEncoder, TextDecoder, process: { env: {} }, fetch: deniedFetch,
    require(name: string) { if (Object.hasOwn(stubs, name)) return stubs[name]; throw new Error(`Unstubbed import ${name}`); }, ...extras });
  const compiled = ts.transpileModule(read(repo, path), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInContext(compiled, context, { filename: `${repo}/${path}`, timeout: 1500 });
  return { api: exports as Record<string, any>, context };
}
function fakeBrowser(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const elements = new Map<string, any>();
  const htmlWrites: string[] = [];
  const events = new Map<string, Function[]>();
  const timers = new Map<number, Function>();
  let timerId = 0;
  function element(key = "") {
    let html = "";
    return { key, hidden: false, textContent: "", value: "", dataset: {}, style: {}, children: [] as any[],
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      get innerHTML() { return html; }, set innerHTML(value) { html = String(value); htmlWrites.push(html); },
      querySelector(selector: string) { return get(`${key} ${selector}`); }, querySelectorAll() { return []; },
      addEventListener() {}, dispatchEvent() {}, appendChild(child: any) { this.children.push(child); }, setAttribute() {},
      getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 800 }; },
      focus() {}, select() {}, remove() {}, scrollTo() {}, getContext() { return null; } };
  }
  function get(key: string) { if (!elements.has(key)) elements.set(key, element(key)); return elements.get(key); }
  const document = { querySelector: get, querySelectorAll() { return []; }, createElement: element,
    createElementNS(_ns: string, tag: string) { return element(tag); }, addEventListener() {}, documentElement: { dataset: {} }, body: element("body") };
  const window = { document, innerWidth: 1000, ORCAH_ACCESS_USER: null as string | null,
    addEventListener(name: string, cb: Function) { events.set(name, [...events.get(name) || [], cb]); },
    dispatchEvent(event: any) { for (const cb of events.get(event.type) || []) cb(event); } } as any;
  class FakeEvent { constructor(public type: string, options: any = {}) { Object.assign(this, options); } }
  const context = vm.createContext({ window, document, console, crypto: { randomUUID: () => `client-${Math.random()}` },
    localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, String(value)), removeItem: (key: string) => store.delete(key) },
    CustomEvent: FakeEvent, Event: FakeEvent, TextEncoder, Uint8Array, Date, Math, Map, Set, URL,
    setTimeout(cb: Function) { const id = ++timerId; timers.set(id, cb); return id; }, clearTimeout(id: number) { timers.delete(id); },
    requestAnimationFrame() {}, fetch: deniedFetch });
  return { context, window, document, store, elements, htmlWrites, events, timers, get };
}
const settle = async () => { for (let n = 0; n < 25; n++) await Promise.resolve(); };
function runJS(browser: ReturnType<typeof fakeBrowser>, path: string) {
  vm.runInContext(read("operacao-orcah", path), browser.context, { filename: path, timeout: 1500 });
}

test("Kanban access gate accepts forged localStorage identity without checking an access code", () => {
  const b = fakeBrowser({ "operacao-orcah-access-v1": JSON.stringify({ user: "Forged operator", expiresAt: Date.now() + 60_000 }) });
  runJS(b, "access.js");
  assert.equal(b.window.ORCAH_ACCESS_USER, "Forged operator");
  assert.equal(b.get("#accessGate").hidden, true);
});

type DocumentRow = { payload: unknown; revision: number; updated_by?: string; updated_client_id?: string };
function syncClient(backend: Map<string, DocumentRow>, user: string | null) {
  const b = fakeBrowser();
  const payloads: Record<string, unknown> = { kanban: [], mindmap: {}, ux: {}, columns: {} };
  const operations: any[] = [];
  b.window.ORCAH_ACCESS_USER = user;
  b.window.ORCAH_KANBAN_API = {
    getCards: () => payloads.kanban, replaceCards: (value: unknown) => { payloads.kanban = value; },
    getMindState: () => payloads.mindmap, replaceMindState: (value: unknown) => { payloads.mindmap = value; },
    getColumns: () => payloads.columns, replaceColumns: (value: unknown) => { payloads.columns = value; } };
  b.window.ORCAH_UX_API = { getState: () => payloads.ux, replaceState: (value: unknown) => { payloads.ux = value; } };
  b.window.supabase = { createClient(_url: string, _key: string, options: any) {
    operations.push({ type: "createClient", options });
    return { from(table: string) {
      let key = ""; let row: any;
      const query = { select() { return query; }, eq(field: string, value: string) { if (field === "document_key") key = value; return query; },
        async maybeSingle() { operations.push({ type: "read", table, key }); return { data: backend.get(key), error: null }; },
        upsert(value: any, options: any) { row = value; operations.push({ type: "upsert", table, value, options }); return query; },
        async single() { const revision = (backend.get(row.document_key)?.revision || 0) + 1; backend.set(row.document_key, { ...row, revision }); return { data: { revision }, error: null }; } };
      return query;
    }, channel() { const channel = { on() { return channel; }, subscribe(callback: Function) { callback("SUBSCRIBED"); return channel; } }; return channel; } };
  } };
  runJS(b, "sync.js");
  return { ...b, payloads, operations, async pushKanban() {
    b.window.dispatchEvent({ type: "orcah:shared-change", detail: { document: "kanban" } });
    for (const [id, cb] of b.timers) { b.timers.delete(id); await cb(); }
    await settle();
  } };
}
const sharedDocs = () => new Map(["kanban", "mindmap", "ux", "columns"].map(key => [key, { payload: key === "kanban" ? [{ id: "base" }] : { fixture: true }, revision: 1 }]));

test("Kanban online event starts publishable-key shared-document reads without any access session", async () => {
  const client = syncClient(sharedDocs(), null);
  assert.equal(client.operations.length, 0);
  client.window.dispatchEvent({ type: "online" });
  await settle();
  assert.equal(client.operations.filter(op => op.type === "read").length, 4);
  assert.equal(client.operations[0].options.auth.persistSession, false);
  assert.equal(client.window.ORCAH_ACCESS_USER, null);
});

test("Kanban whole-document upserts lose concurrent changes and trust global author attribution", async () => {
  const backend = sharedDocs();
  const a = syncClient(backend, "Adriel");
  const b = syncClient(backend, "Cesar");
  await settle();
  a.payloads.kanban = [...a.payloads.kanban as any[], { id: "edit-A" }];
  b.payloads.kanban = [...b.payloads.kanban as any[], { id: "edit-B" }];
  await a.pushKanban();
  b.window.ORCAH_ACCESS_USER = "Forged author";
  await b.pushKanban();
  assert.deepEqual(backend.get("kanban")!.payload, [{ id: "base" }, { id: "edit-B" }]);
  assert.equal((backend.get("kanban")! as any).updated_by, "Forged author");
  assert.equal(Object.hasOwn(b.operations.find(op => op.type === "upsert").value, "revision"), false);
});

test("UX synchronized state injects frame/block IDs and mobileWidth into HTML sinks", () => {
  const b = fakeBrowser({ "operacao-orcah-ui-state-v1": JSON.stringify({ studioMode: "product" }) });
  runJS(b, "ux-studio.js");
  b.window.ORCAH_UX_API.replaceState({ frames: [{ id: '\"><img src=x onerror="globalThis.auditXss=1">', name: "Fixture", route: "/fixture", version: "Atual", status: "Atual", device: "Fixture", mobileWidth: "390<img src=x onerror=globalThis.auditXss=2>", protected: true,
    blocks: [{ id: '\"><img src=x onerror="globalThis.auditXss=3">', type: "TEXTO", label: "Safe", text: "<img src=x onerror=4>", visible: true }], comments: [] }], connectors: [] });
  const writes = b.htmlWrites.join("\n");
  assert.match(writes, /<img src=x onerror="globalThis.auditXss=1">/);
  assert.match(writes, /390<img src=x onerror=globalThis.auditXss=2>/);
  assert.match(writes, /<img src=x onerror="globalThis.auditXss=3">/);
  assert.match(writes, /&lt;img src=x onerror=4&gt;/);
});

function galleryRoute({ denied = false, race = false, deleted = false, failure = false } = {}) {
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, companyId: 2, active: true, path: `/uploads/companies/2/gallery/${i + 1}.webp`, title: `Caption ${i + 1}`, description: "Keep this", sortOrder: i }));
  rows.push({ id: 99, companyId: 3, active: true, path: "/uploads/companies/3/gallery/99.webp", title: "Other tenant", description: "Private", sortOrder: 0 });
  const uploads: any[] = [], removals: string[] = [];
  const db = { companyPhoto: {
    async findFirst({ where }: any) { const found = rows.find(row => row.id === where.id && row.companyId === where.companyId && row.active === where.active); return found ? { ...found } : null; },
    async updateMany({ where, data }: any) {
      const row = rows.find(row => row.id === where.id);
      if (deleted && row) row.active = false;
      if (race && row) row.path = "https://storage.test/concurrent.webp";
      if (failure) throw new Error("Simulated database failure");
      if (!row || row.path !== where.path || row.companyId !== where.companyId || row.active !== where.active) return { count: 0 };
      Object.assign(row, data); return { count: 1 };
    } } };
  class UploadError extends Error {}
  const result = loadTS("pr10", "src/app/api/empresa/fotos/[id]/route.ts", {
    "next/server": { NextResponse: Response }, "@/lib/plan": { requireActivePlan: async () => denied ? { error: Response.json({ error: "Denied" }, { status: 401 }) } : { company: { id: 2 } } },
    "@/lib/db": { prisma: db }, "@/lib/storage": { UploadError, uploadCompanyImage: async (input: any) => { uploads.push(input); return "https://storage.test/replacement.webp"; }, removeCompanyImage: async (_companyId: number, path: string) => { removals.push(path); return true; } } });
  const post = async (id: string, file: File | string = new File(["fixture"], "photo.png", { type: "image/png" })) => {
    const form = new FormData(); form.set("file", file);
    return result.api.POST(new Request("https://audit.test/api/empresa/fotos/" + id, { method: "POST", body: form }), { params: Promise.resolve({ id }) });
  };
  return { rows, uploads, removals, post };
}

test("PR10 gallery replacement preserves row, caption, description, ordering and 12-photo quota", async () => {
  const f = galleryRoute(); const before = { ...f.rows[0] };
  const response = await f.post("1");
  assert.equal(response.status, 200);
  assert.deepEqual(f.rows[0], { ...before, path: "https://storage.test/replacement.webp" });
  assert.equal(f.rows.filter(row => row.companyId === 2).length, 12);
  assert.deepEqual(f.removals, [before.path]);
});
test("PR10 denies unauthenticated and cross-tenant replacement before upload", async () => {
  const denied = galleryRoute({ denied: true }); assert.equal((await denied.post("1")).status, 401); assert.equal(denied.uploads.length, 0);
  const f = galleryRoute(); assert.equal((await f.post("99")).status, 404); assert.equal(f.uploads.length, 0);
  assert.equal((await f.post("invalid")).status, 404); assert.equal((await f.post("0")).status, 404);
});
test("PR10 invalid multipart file is rejected before upload", async () => {
  const f = galleryRoute(); assert.equal((await f.post("1", "not-a-file")).status, 400); assert.equal(f.uploads.length, 0);
});
for (const change of ["race", "deleted"] as const) test(`PR10 ${change} compare-and-swap cleans new object without overwriting current row`, async () => {
  const f = galleryRoute({ [change]: true }); const response = await f.post("1");
  assert.equal(response.status, 409);
  assert.deepEqual(f.removals, ["https://storage.test/replacement.webp"]);
  assert.notEqual(f.rows[0].path, "https://storage.test/replacement.webp");
});
test("PR10 database error cleans new object and preserves old photo", async () => {
  const f = galleryRoute({ failure: true }); const before = { ...f.rows[0] };
  assert.equal((await f.post("1")).status, 500); assert.deepEqual(f.rows[0], before);
  assert.deepEqual(f.removals, ["https://storage.test/replacement.webp"]);
});

test("PR10 asset recovery hides local production URLs and retains dev/remote URLs", () => {
  const { api } = loadTS("pr10", "src/lib/asset-recovery.ts");
  assert.equal(api.publicAssetOrNull("/uploads/companies/2/gallery/a.webp", true), null);
  assert.equal(api.publicAssetOrNull("/uploads/companies/2/gallery/a.webp", false), "/uploads/companies/2/gallery/a.webp");
  assert.equal(api.publicAssetOrNull("https://storage.test/a.webp", true), "https://storage.test/a.webp");
});
test("main baseline has no single-photo replacement method; PR10 adds it", () => {
  assert.doesNotMatch(read("orcah-clone", "src/app/api/empresa/fotos/[id]/route.ts"), /export async function POST/);
  assert.match(read("pr10", "src/app/api/empresa/fotos/[id]/route.ts"), /export async function POST/);
});

test("Control public health route invokes configured privileged pings without a session", async () => {
  const pings: string[] = [];
  const health = loadTS("orcah-control", "src/lib/health.ts", {
    "@/lib/asaas": { asaasBaseUrl: () => "https://mock-asaas.invalid/v3", asaasConfigured: () => true },
    "@/lib/control-api": { controlApi: async (action: string) => { pings.push(action); return { ok: true }; } }
  }, { fetch: async (url: string) => { pings.push(url); return new Response("{}", { status: 200 }); } }).api;
  const route = loadTS("orcah-control", "src/app/api/health/route.ts", { "next/server": { NextResponse: Response }, "@/lib/health": health }).api;
  for (let n = 0; n < 3; n++) assert.equal((await route.GET()).status, 200);
  assert.equal(pings.filter(p => p === "health").length, 3);
  assert.equal(pings.filter(p => p.startsWith("https://mock-asaas.invalid")).length, 3);
});

function dockHarness(soundEnabled = true) {
  let audioStarts = 0;
  const navigations: string[] = [];
  const jsx = (type: any, props: any) => ({ type, props });
  const parameter = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  class AudioContext {
    state = "running"; currentTime = 0; destination = {};
    constructor() { audioStarts++; }
    createOscillator() { return { frequency: parameter, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: parameter, connect() {} }; }
  }
  const { api } = loadTS("pr9", "src/components/liquid-dock.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx }, "react": { useRef: (initial: any) => ({ current: initial }), useState: (initial: any) => [initial, () => {}] },
    "next/link": { default: "a" }, "next/navigation": { useRouter: () => ({ push: (href: string) => navigations.push(href) }) },
    "./liquid-dock.module.css": { default: new Proxy({}, { get: (_obj, name) => String(name) }) }
  }, { window: { AudioContext } });
  const tree = api.LiquidDock({ items: [{ id: "home", label: "Início", href: "/painel", icon: "H" }, { id: "clientes", label: "Clientes", href: "/painel/clientes", icon: "C" }], activeId: "home", soundEnabled });
  tree.props.ref.current = { getBoundingClientRect: () => ({ left: 0, width: 400 }) };
  const nodes: any[] = [];
  function visit(node: any) { if (!node || typeof node !== "object") return; nodes.push(node); for (const child of [node.props?.children].flat(5)) visit(child); }
  visit(tree);
  const orb = nodes.find(node => node.props?.onPointerDown);
  const event = (clientX: number) => ({ clientX, pointerId: 1, pointerType: "touch", currentTarget: { setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} } });
  return { nodes, orb, event, navigations, audioStarts: () => audioStarts };
}
test("PR9 mount has no audio autoplay, native labelled links remain, drag navigates and cancellation does not", () => {
  const h = dockHarness();
  assert.equal(h.audioStarts(), 0);
  const links = h.nodes.filter(node => node.type === "a");
  assert.equal(links.length, 2);
  assert.equal(links[0].props["aria-current"], "page");
  assert.equal(links[1].props.href, "/painel/clientes");
  assert.equal(links[1].props["aria-label"], "Clientes");
  h.orb.props.onPointerDown(h.event(20)); h.orb.props.onPointerMove(h.event(300)); h.orb.props.onPointerCancel(h.event(300)); h.orb.props.onPointerUp(h.event(300));
  assert.deepEqual(h.navigations, []); assert.equal(h.audioStarts(), 0);
  h.orb.props.onPointerDown(h.event(20)); h.orb.props.onPointerMove(h.event(300)); h.orb.props.onPointerUp(h.event(300));
  assert.deepEqual(h.navigations, ["/painel/clientes"]); assert.equal(h.audioStarts(), 1);
});
test("PR9 sound disabled keeps gesture navigation silent", () => {
  const h = dockHarness(false);
  h.orb.props.onPointerDown(h.event(20)); h.orb.props.onPointerMove(h.event(300)); h.orb.props.onPointerUp(h.event(300));
  assert.equal(h.audioStarts(), 0); assert.deepEqual(h.navigations, ["/painel/clientes"]);
});
