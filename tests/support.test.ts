import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { messageInput, SupportError } from "../src/lib/support/domain";
import { controlAuthorized, requireSameOrigin, supportBody } from "../src/lib/support/security";
import { actOnSupportThread, ensureSupportThread, readSupportThread, sendSupportMessage } from "../src/lib/support/service";
import type { OperatorActor, ProviderActor } from "../src/lib/support/types";
import { table } from "./helpers/fake-db";

const user: ProviderActor = { kind: "provider", userId: 1, companyId: 10 };
const other: ProviderActor = { kind: "provider", userId: 2, companyId: 20 };
const adriel: OperatorActor = { kind: "operator", id: "1", name: "Adriel" };
const cesar: OperatorActor = { kind: "operator", id: "2", name: "César" };
const reply = async () => ({ content: "Abra Orçamentos e toque em Novo orçamento.", sources: ["orcamentos"], provider: "local" });

function fixture() {
  const supportThread = table({ status: "BOT", priority: "NORMAL", assignedOperator: null, assignedOperatorId: null, lastMessageAt: new Date(), queuedAt: null, humanStartedAt: null, resolvedAt: null });
  const supportMessage = table({ clientId: null, senderName: null, readAt: null });
  const originalUpsert = supportThread.upsert;
  supportThread.upsert = async args => {
    const compound = args.where.companyId_userId as Record<string, unknown>;
    return originalUpsert({ ...args, where: compound ?? args.where });
  };
  let lock = Promise.resolve();
  const db = { supportThread, supportMessage, $queryRaw: async () => [],
    async $transaction<T>(run: (tx: unknown) => Promise<T>): Promise<T> {
      const previous = lock; let release!: () => void;
      lock = new Promise<void>(resolve => { release = resolve; });
      await previous;
      const snapshot = [structuredClone(supportThread.rows), structuredClone(supportMessage.rows)];
      try { return await run(db); } catch (error) {
        supportThread.rows.splice(0, supportThread.rows.length, ...snapshot[0]);
        supportMessage.rows.splice(0, supportMessage.rows.length, ...snapshot[1]);
        throw error;
      } finally { release(); }
    },
  };
  return { raw: db, db: db as never };
}

describe("suporte persistente e autorização", () => {
  it("cria uma conversa por usuário/empresa e reutiliza no F5", async () => {
    const { db } = fixture();
    const a = await ensureSupportThread(db, user), b = await ensureSupportThread(db, user);
    assert.equal(a.id, b.id); assert.equal(a.status, "BOT");
  });
  it("nega leitura, envio e handoff de outra empresa/usuário", async () => {
    const { db } = fixture(); const t = await ensureSupportThread(db, other);
    for (const actor of [user, { ...other, userId: 3 }, { ...other, companyId: 10 }]) {
      await assert.rejects(readSupportThread(db, actor, t.id), { status: 404 });
      await assert.rejects(sendSupportMessage(db, actor, t.id, { content: "Olá", clientId: "request_123" }), { status: 404 });
      await assert.rejects(actOnSupportThread(db, actor, t.id, "escalate"), { status: 404 });
    }
  });
  it("executa BOT → QUEUED → HUMAN → RESOLVED → BOT na mesma conversa", async () => {
    const { db } = fixture(); const t = await ensureSupportThread(db, user);
    let s = await sendSupportMessage(db, user, t.id, { content: "Como criar orçamento?", clientId: "question_123" }, reply);
    assert.deepEqual(s.messages.map(m => m.senderType), ["USER", "ASSISTANT"]);
    s = await actOnSupportThread(db, user, t.id, "escalate"); assert.equal(s.thread.status, "QUEUED");
    s = await actOnSupportThread(db, adriel, t.id, "claim"); assert.equal(s.thread.status, "HUMAN"); assert.equal(s.thread.assignedOperator, "Adriel");
    await sendSupportMessage(db, adriel, t.id, { content: "Posso ajudar!", clientId: "human_123" });
    s = await readSupportThread(db, user, t.id); assert.ok(s.messages.some(m => m.senderType === "OPERATOR" && m.senderName === "Adriel"));
    s = await actOnSupportThread(db, adriel, t.id, "resolve"); assert.equal(s.thread.status, "RESOLVED");
    await assert.rejects(sendSupportMessage(db, user, t.id, { content: "oi", clientId: "resolved_123" }), { status: 409 });
    s = await actOnSupportThread(db, user, t.id, "return-to-bot"); assert.equal(s.thread.id, t.id); assert.equal(s.thread.status, "BOT");
    assert.equal(s.messages.filter(m => m.senderType === "SYSTEM").length, 4);
  });
  it("cancela fila, reabre resolvido e marca prioridade", async () => {
    const { db } = fixture(); const t = await ensureSupportThread(db, user);
    await actOnSupportThread(db, user, t.id, "escalate");
    assert.equal((await actOnSupportThread(db, user, t.id, "cancel-human")).thread.status, "BOT");
    await actOnSupportThread(db, user, t.id, "escalate"); await actOnSupportThread(db, cesar, t.id, "claim");
    await actOnSupportThread(db, cesar, t.id, "resolve");
    const reopened = await actOnSupportThread(db, adriel, t.id, "reopen");
    assert.equal(reopened.thread.status, "QUEUED");
    const prioritized = await actOnSupportThread(db, adriel, t.id, "priority", "HIGH");
    assert.equal(prioritized.thread.priority, "HIGH");
    assert.equal(prioritized.thread.queuedAt, reopened.thread.queuedAt, "prioridade preserva a ordem de chegada");
  });
  it("impede prestador de assumir/forjar operador e outro operador de responder", async () => {
    const { db } = fixture(); const t = await ensureSupportThread(db, user);
    for (const sender of [{ senderType: "OPERATOR" }, { senderName: "Adriel" }, { operator: adriel }]) {
      await assert.rejects(sendSupportMessage(db, user, t.id, { content: "oi", clientId: "forge_123", ...sender }), { status: 400 });
    }
    await assert.rejects(actOnSupportThread(db, user, t.id, "claim"), { status: 403 });
    await actOnSupportThread(db, user, t.id, "escalate"); await actOnSupportThread(db, adriel, t.id, "claim");
    await assert.rejects(sendSupportMessage(db, cesar, t.id, { content: "oi", clientId: "cesar_123" }), { status: 409 });
  });
  it("serializa duas tentativas de claim e mantém somente um operador", async () => {
    const { db } = fixture(); const t = await ensureSupportThread(db, user); await actOnSupportThread(db, user, t.id, "escalate");
    const results = await Promise.allSettled([actOnSupportThread(db, adriel, t.id, "claim"), actOnSupportThread(db, cesar, t.id, "claim")]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  });
  it("reenvio concorrente não duplica mensagem nem resposta", async () => {
    const { db } = fixture(); const t = await ensureSupportThread(db, user);
    await Promise.all(Array.from({ length: 3 }, () => sendSupportMessage(db, user, t.id, { content: "orçamento", clientId: "retry_123" }, reply)));
    const s = await readSupportThread(db, user, t.id); assert.equal(s.messages.length, 2);
    await assert.rejects(sendSupportMessage(db, user, t.id, { content: "diferente", clientId: "retry_123" }), { status: 409 });
  });
  it("não publica resposta do bot depois de handoff concorrente", async () => {
    const { db } = fixture(); const t = await ensureSupportThread(db, user);
    await sendSupportMessage(db, user, t.id, { content: "oi", clientId: "race_1234" }, async () => { await actOnSupportThread(db, user, t.id, "escalate"); return reply(); });
    assert.equal((await readSupportThread(db, user, t.id)).messages.filter(m => m.senderType === "ASSISTANT").length, 0);
  });
  it("aplica limite persistente de 15 mensagens/minuto e limite de tamanho", async () => {
    const { db } = fixture(); const t = await ensureSupportThread(db, user);
    for (let n = 0; n < 15; n++) await sendSupportMessage(db, user, t.id, { content: "oi", clientId: `limit_000${n}` });
    await assert.rejects(sendSupportMessage(db, user, t.id, { content: "oi", clientId: "limit_over" }), { status: 429 });
    assert.throws(() => messageInput({ content: "x".repeat(2001), clientId: "long_1234" }), SupportError);
    assert.throws(() => messageInput({ content: " ", clientId: "empty_123" }), SupportError);
  });
});

describe("fronteira HTTP segura", () => {
  it("rejeita segredo ausente/errado/curto/unicode; aceita segredo válido", () => {
    const secret = "s".repeat(32);
    assert.equal(controlAuthorized(new Request("http://localhost"), secret), false);
    assert.equal(controlAuthorized(new Request("http://localhost", { headers: { "x-orcah-control-secret": "x".repeat(32) } }), secret), false);
    assert.equal(controlAuthorized(new Request("http://localhost", { headers: { "x-orcah-control-secret": "é".repeat(32) } }), secret), false);
    assert.equal(controlAuthorized(new Request("http://localhost", { headers: { "x-orcah-control-secret": secret } }), secret), true);
    assert.equal(controlAuthorized(new Request("http://localhost"), ""), false);
  });
  it("rejeita escrita cross-site e JSON inválido/corpo excessivo", async () => {
    assert.throws(() => requireSameOrigin(new Request("http://localhost/api", { headers: { origin: "https://evil.test" } })), { status: 403 });
    await assert.rejects(supportBody(new Request("http://localhost", { method: "POST", body: "null" })), { status: 400 });
    await assert.rejects(supportBody(new Request("http://localhost", { method: "POST", body: "x".repeat(12001) })), { status: 413 });
  });
  it("React renderiza HTML arbitrário como texto", () => {
    const html = renderToStaticMarkup(createElement("p", null, '<img src=x onerror="alert(1)"><script>alert(2)</script>'));
    assert.ok(!html.includes("<script>")); assert.ok(!html.includes("<img")); assert.ok(html.includes("&lt;script&gt;"));
  });
});
