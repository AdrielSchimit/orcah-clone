/** Local-only HTTP/Postgres integration. Never accepts a remote or production database. */
import assert from "node:assert/strict";
import { randomUUID, pbkdf2Sync } from "node:crypto";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

async function main() {
  const databaseUrl = process.env.SUPPORT_TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error("Defina SUPPORT_TEST_DATABASE_URL para um PostgreSQL LOCAL dedicado chamado orcah_support_test. Aplique somente nele o schema/migration antes do teste.");
  const url = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/orcah_support_test") throw new Error("Este teste aceita apenas banco LOCAL orcah_support_test.");
  const repo = process.cwd(), control = resolve(process.env.SUPPORT_TEST_CONTROL_DIR || join(repo, "..", "orcah-control"));
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const nonce = randomUUID().slice(0, 8), password = "Support-QA!2026";
  const mainSecret = "local-qa-main-secret-at-least-32-characters";
  const controlSecret = "local-qa-control-secret-at-least-32-characters";
  const bridgeSecret = "local-qa-bridge-secret-at-least-32-characters";
  const app = "http://localhost:3100", inbox = "http://localhost:3101";
  const hash = await import("bcryptjs").then(b => b.hash(password, 4));
  const salt = Buffer.from("local-support-qa");
  const adminHash = `pbkdf2_sha256$210000$${salt.toString("base64url")}$${pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("base64url")}`;
  const users: number[] = [];
  const processes: ReturnType<typeof spawn>[] = [];
  const logs: string[] = [];
  function start(directory: string, port: number, env: Record<string, string>) {
    const child = spawn(process.execPath, [join(directory, "node_modules/next/dist/bin/next"), "dev", "--port", String(port)], { cwd: directory, env: { ...process.env, ...env }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    processes.push(child);
    child.stdout?.on("data", chunk => logs.push(chunk.toString())); child.stderr?.on("data", chunk => logs.push(chunk.toString()));
  }
  async function ready(base: string) {
    for (let n = 0; n < 60; n++) { try { const r = await fetch(`${base}/login`, { signal: AbortSignal.timeout(5000) }); if (r.ok) return; } catch {} await new Promise(r => setTimeout(r, 500)); }
    throw new Error(`Servidor local indisponível: ${base}`);
  }
  async function jwt(payload: Record<string, unknown>, secret: string) { return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret)); }
  async function call(base: string, path: string, cookie = "", body?: unknown, method = "POST") {
    const response = await fetch(`${base}${path}`, { method: body === undefined ? "GET" : method, headers: { cookie, origin: base, ...(body === undefined ? {} : { "content-type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json(); return { response, data };
  }
  try {
    const state = await db.state.upsert({ where: { uf: "QA" }, create: { name: "Estado QA", uf: "QA", ibgeCode: "99" }, update: {} });
    for (const label of ["A", "B"]) {
      const user = await db.user.create({ data: { name: `Prestador QA ${label}`, email: `support-${label.toLowerCase()}-${nonce}@example.test`, emailVerifiedAt: new Date(), passwordHash: hash, company: { create: { name: `Empresa QA ${label}`, slug: `support-qa-${label.toLowerCase()}-${nonce}`, phone: "11999999999", whatsapp: "11999999999", email: `support-${label.toLowerCase()}-${nonce}@example.test`, stateId: state.id, customRamoName: "Pintura", subscription: { create: { status: "active", amount: 29, provider: "local", startsAt: new Date() } } } } } });
      users.push(user.id);
    }
    start(repo, 3100, { DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl, AUTH_SECRET: mainSecret, CONTROL_INTERNAL_SECRET: bridgeSecret, NEXT_PUBLIC_APP_URL: app, OPENAI_API_KEY: "", SUPPORT_AI_MODEL: "" });
    // Control has no DB credentials and all support reads/writes use the bridge.
    start(control, 3101, { DATABASE_URL: "", DIRECT_URL: "", CONTROL_APP_URL: app, CONTROL_INTERNAL_SECRET: bridgeSecret, CONTROL_AUTH_SECRET: controlSecret, CONTROL_ADMIN_USER: "adriel", CONTROL_ADMIN_PASSWORD_HASH: adminHash });
    await Promise.all([ready(app), ready(inbox)]);
    console.log("PASS: dois servidores locais prontos; Control sem credenciais de banco");
    const provider = `orcah_session=${await jwt({ userId: users[0] }, mainSecret)}`;
    const stranger = `orcah_session=${await jwt({ userId: users[1] }, mainSecret)}`;
    const operator = `orcah_control_session=${await jwt({ userId: 1, email: "adriel", name: "Adriel" }, controlSecret)}`;
    let r = await call(app, "/api/support/thread", provider); assert.equal(r.response.status, 200); const id: string = r.data.thread.id;
    assert.equal((await call(app, `/api/support/thread?threadId=${id}`, stranger)).response.status, 404);
    assert.equal((await call(app, "/api/support/messages", stranger, { threadId: id, content: "invasão", clientId: randomUUID() })).response.status, 404);
    assert.equal((await call(app, "/api/support/messages", provider, { threadId: id, content: "forja", clientId: randomUUID(), senderType: "OPERATOR" })).response.status, 400);
    assert.equal((await call(inbox, `/api/support/threads/${id}/claim`, "", {})).response.status, 401);
    assert.equal((await call(app, "/api/internal/control", "", { action: "support" })).response.status, 401);
    console.log("PASS: autorização HTTP entre contas, remetente, sessão Control e segredo interno");
    const clientId = randomUUID();
    r = await call(app, "/api/support/messages", provider, { threadId: id, content: "Como criar um orçamento?", clientId, route: "/painel/orcamentos/novo" });
    assert.equal(r.response.status, 200); assert.ok(r.data.messages.some((m: { senderType: string; content: string }) => m.senderType === "ASSISTANT" && m.content.includes("Novo orçamento")));
    r = await call(app, "/api/support/messages", provider, { threadId: id, content: "Como criar um orçamento?", clientId }); assert.equal(r.data.messages.length, 2);
    assert.equal((await call(app, "/api/support/thread", provider)).data.messages.length, 2);
    r = await call(app, "/api/support/escalate", provider, { threadId: id }); assert.equal(r.data.thread.status, "QUEUED");
    const queue = await call(inbox, "/api/support/inbox?status=QUEUED&q=Empresa%20QA%20A", operator); assert.equal(queue.response.status, 200); assert.ok(queue.data.rows.some((row: { id: string }) => row.id === id));
    console.log("PASS: resposta local RAG, persistência, idempotência e fila no Control");
    r = await call(inbox, `/api/support/threads/${id}/claim`, operator, {}); assert.equal(r.response.status, 200); assert.equal(r.data.thread.assignedOperator, "Adriel");
    r = await call(app, "/api/support/thread", provider); assert.equal(r.data.thread.status, "HUMAN");
    r = await call(inbox, `/api/support/threads/${id}/messages`, operator, { content: "Olá, continuo seu atendimento aqui.", clientId: randomUUID(), senderName: "Forjado" }); assert.equal(r.response.status, 200);
    r = await call(app, "/api/support/thread", provider); assert.ok(r.data.messages.some((m: { senderType: string; senderName: string }) => m.senderType === "OPERATOR" && m.senderName === "Adriel")); assert.ok(r.data.thread.unread > 0);
    await call(app, "/api/support/read", provider, { threadId: id, throughId: r.data.messages.at(-1).id });
    assert.equal((await call(app, "/api/support/thread", provider)).data.thread.unread, 0);
    r = await call(inbox, `/api/support/threads/${id}/priority`, operator, { priority: "HIGH" }, "PATCH"); assert.equal(r.data.thread.priority, "HIGH");
    r = await call(inbox, `/api/support/threads/${id}/resolve`, operator, {}); assert.equal(r.data.thread.status, "RESOLVED");
    assert.equal((await call(app, "/api/support/thread", provider)).data.thread.status, "RESOLVED");
    r = await call(app, "/api/support/return-to-bot", provider, { threadId: id }); assert.equal(r.data.thread.status, "BOT");
    console.log("PASS: claim, resposta humana, não lidas, prioridade, resolução e retorno ao mascote");
    const cesar = `orcah_control_session=${await jwt({ userId: 2, email: "cesar", name: "Cesar" }, controlSecret)}`;
    const second = (await call(app, "/api/support/thread", stranger)).data.thread.id;
    const duplicate = { threadId: second, content: "Como configurar minha página?", clientId: randomUUID() };
    const retries = await Promise.all([call(app, "/api/support/messages", stranger, duplicate), call(app, "/api/support/messages", stranger, duplicate)]);
    assert.ok(retries.every(result => result.response.status === 200));
    assert.equal((await call(app, "/api/support/thread", stranger)).data.messages.length, 2);
    await call(app, "/api/support/escalate", stranger, { threadId: second });
    const claims = await Promise.all([call(inbox, `/api/support/threads/${second}/claim`, operator, {}), call(inbox, `/api/support/threads/${second}/claim`, cesar, {})]);
    assert.deepEqual(claims.map(result => result.response.status).sort(), [200, 409]);
    const loser = claims[0].response.status === 409 ? operator : cesar;
    assert.equal((await call(inbox, `/api/support/threads/${second}/messages`, loser, { content: "Não sou o responsável", clientId: randomUUID() })).response.status, 409);
    assert.equal((await call(app, "/api/support/messages", stranger, { threadId: second, content: "x".repeat(2001), clientId: randomUUID() })).response.status, 400);
    for (let n = 0; n < 14; n++) assert.equal((await call(app, "/api/support/messages", stranger, { threadId: second, content: `Mensagem de teste ${n}`, clientId: randomUUID() })).response.status, 200);
    assert.equal((await call(app, "/api/support/messages", stranger, { threadId: second, content: "Limite", clientId: randomUUID() })).response.status, 429);
    console.log("PASS: idempotência concorrente, dois operadores disputam claim, proprietário e limites HTTP");
    // Seed an older page only in this dedicated fixture to test the real SQL cursor.
    const oldDate = Date.now() - 120_000;
    await db.supportMessage.createMany({ data: Array.from({ length: 110 }, (_, n) => ({ id: randomUUID(), threadId: id, senderType: "USER" as const, content: `Histórico local ${n}`, createdAt: new Date(oldDate + n) })) });
    const latest = (await call(app, "/api/support/thread", provider)).data;
    assert.equal(latest.messages.length, 100); assert.ok(latest.olderCursor);
    const older = (await call(app, `/api/support/thread?threadId=${id}&before=${latest.olderCursor}`, provider)).data;
    assert.ok(older.messages.length > 0); assert.equal(older.olderCursor, null);
    const ids = [...older.messages, ...latest.messages].map((message: { id: string }) => message.id);
    assert.equal(new Set(ids).size, ids.length);
    console.log("PASS: paginação de histórico real sem perda ou duplicação");
    // Verify actual PostgreSQL grants and RLS, including SELECT/INSERT/UPDATE/DELETE privileges.
    const protectedTables = await db.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('support_threads', 'support_messages')`;
    assert.equal(protectedTables.length, 2); assert.ok(protectedTables.every(t => t.relrowsecurity));
    for (const role of ["anon", "authenticated"]) for (const table of ["support_threads", "support_messages"]) for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      const rows = await db.$queryRaw<{ allowed: boolean }[]>`SELECT has_table_privilege(${role}, ${table}, ${privilege}) AS allowed`; assert.equal(rows[0].allowed, false);
    }
    console.log("PASS: migration SQL aplicada somente no PostgreSQL local; RLS ativo e 16 permissões de browser negadas");
    if (process.env.SUPPORT_TEST_KEEP_SERVERS === "1") {
      console.log(`QA local: ${app}/login e ${inbox}/login. Usuário prestador: support-a-${nonce}@example.test. Control: adriel. Senha de teste: ${password}`);
      console.log("Servidores mantidos para inspeção visual. Interrompa com Ctrl+C para limpar fixtures.");
      await new Promise<void>(resolve => { process.once("SIGINT", resolve); process.once("SIGTERM", resolve); });
    }
  } catch (error) {
    console.error(logs.slice(-12).join("\n")); throw error;
  } finally {
    for (const child of processes) {
      if (child.pid && process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
      else child.kill();
    }
    await db.user.deleteMany({ where: { id: { in: users } } }); await db.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Falha na integração local"); process.exitCode = 1; });
