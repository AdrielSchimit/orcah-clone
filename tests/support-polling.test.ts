import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";
import { pollingTransport, supportFetch } from "../src/lib/support/transport";
import { mergeSnapshot, reconcileMessages, type PendingMessage } from "../src/lib/support/reconcile";
import type { SupportMessageDTO, SupportSnapshot } from "../src/lib/support/types";
import { supportPollInterval } from "../src/lib/support/use-support-thread";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
function pollingEnvironment(t: TestContext) {
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const win = new EventTarget(), nav = { onLine: true };
  for (const [key, value] of Object.entries({ document: doc, window: win, navigator: nav })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); });
  }
  let sequence = 0;
  const timers = new Map<number, { callback: () => void; delay: number }>();
  t.mock.method(globalThis, "setTimeout", (callback: () => void, delay: number) => { const id = ++sequence; timers.set(id, { callback, delay }); return id as unknown as ReturnType<typeof setTimeout>; });
  t.mock.method(globalThis, "clearTimeout", (id: ReturnType<typeof setTimeout> | undefined) => { timers.delete(Number(id)); });
  const advance = async () => {
    const first = timers.entries().next().value;
    assert.ok(first, "há um próximo polling agendado");
    timers.delete(first[0]); first[1].callback(); await flush();
  };
  return { doc, win, nav, timers, advance };
}

describe("polling cancelável", () => {
  it("cancela o refresh ativo ao parar e não agenda outro tick", async t => {
    const env = pollingEnvironment(t); const signals: AbortSignal[] = [], states: boolean[] = [];
    const stop = pollingTransport().subscribe(signal => {
      signals.push(signal);
      return new Promise<void>((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
    }, connected => states.push(connected));
    assert.equal(signals.length, 1); stop(); await flush();
    assert.equal(signals[0].aborted, true); assert.equal(env.timers.size, 0); assert.ok(!states.includes(true));
    env.win.dispatchEvent(new Event("online")); env.doc.dispatchEvent(new Event("visibilitychange")); await flush();
    assert.equal(signals.length, 1, "unsubscribe remove listeners de resume");
  });
  it("hidden/offline cancelam a requisição e pausam sem timer; resume usa sinal novo", async t => {
    const env = pollingEnvironment(t); const signals: AbortSignal[] = [], states: boolean[] = [];
    const stop = pollingTransport().subscribe(signal => {
      signals.push(signal);
      return new Promise<void>((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
    }, connected => states.push(connected));
    try {
      env.doc.visibilityState = "hidden"; env.doc.dispatchEvent(new Event("visibilitychange")); await flush();
      assert.equal(signals[0].aborted, true); assert.equal(env.timers.size, 0); assert.equal(states.at(-1), false);
      env.nav.onLine = false; env.doc.visibilityState = "visible"; env.doc.dispatchEvent(new Event("visibilitychange")); await flush();
      assert.equal(signals.length, 1); assert.equal(env.timers.size, 0);
      env.nav.onLine = true; env.win.dispatchEvent(new Event("online")); await flush();
      assert.equal(signals.length, 2); assert.notEqual(signals[1], signals[0]); assert.equal(signals[1].aborted, false);
      env.nav.onLine = false; env.win.dispatchEvent(new Event("offline")); await flush();
      assert.equal(signals[1].aborted, true); assert.equal(env.timers.size, 0);
    } finally { stop(); await flush(); }
  });
  it("aplica backoff limitado e resume reinicia intervalo normal", async t => {
    const env = pollingEnvironment(t); const signals: AbortSignal[] = []; let fail = true;
    const stop = pollingTransport(2000).subscribe(async signal => { signals.push(signal); if (fail) throw new Error("offline remoto"); }, () => {});
    try {
      await flush();
      const delays: number[] = [];
      for (let n = 0; n < 6; n++) { delays.push([...env.timers.values()][0].delay); await env.advance(); }
      assert.deepEqual(delays, [4000, 8000, 16000, 30000, 30000, 30000]);
      assert.equal(new Set(signals).size, signals.length, "cada tick possui seu próprio AbortController");
      env.doc.visibilityState = "hidden"; env.doc.dispatchEvent(new Event("visibilitychange")); await flush();
      assert.equal(env.timers.size, 0);
      fail = false; const before = signals.length;
      env.doc.visibilityState = "visible"; env.doc.dispatchEvent(new Event("visibilitychange")); await flush();
      assert.equal(signals.length, before + 1); assert.equal([...env.timers.values()][0].delay, 2000);
    } finally { stop(); }
  });
  it("não instala timer nem faz refresh quando inicia hidden ou offline", async t => {
    const env = pollingEnvironment(t); let calls = 0;
    env.doc.visibilityState = "hidden";
    const stop = pollingTransport().subscribe(async () => { calls++; }, () => {});
    try {
      await flush(); assert.equal(calls, 0); assert.equal(env.timers.size, 0);
      env.doc.visibilityState = "visible"; env.nav.onLine = false; env.doc.dispatchEvent(new Event("visibilitychange")); await flush();
      assert.equal(calls, 0); assert.equal(env.timers.size, 0);
      env.nav.onLine = true; env.win.dispatchEvent(new Event("online")); await flush();
      assert.equal(calls, 1); assert.equal(env.timers.size, 1);
    } finally { stop(); }
  });
  it("resume durante cleanup de refresh abortado inicia novo tick sem incrementar backoff", async t => {
    const env = pollingEnvironment(t); const signals: AbortSignal[] = []; let finish!: () => void;
    const stop = pollingTransport().subscribe(signal => {
      signals.push(signal);
      return signals.length === 1 ? new Promise<void>(resolve => { finish = resolve; }) : Promise.resolve();
    }, () => {});
    try {
      env.doc.visibilityState = "hidden"; env.doc.dispatchEvent(new Event("visibilitychange"));
      assert.equal(signals[0].aborted, true);
      env.doc.visibilityState = "visible"; env.doc.dispatchEvent(new Event("visibilitychange"));
      assert.equal(signals.length, 1, "aguarda término do refresh cancelado");
      finish(); await flush();
      assert.equal(signals.length, 2); assert.equal(signals[1].aborted, false);
      assert.equal([...env.timers.values()][0].delay, 2000);
    } finally { finish(); stop(); await flush(); }
  });
  it("aba com chat fechado em BOT/RESOLVED faz polling lento; aberto, fila ou humano mantém 2s", () => {
    assert.equal(supportPollInterval(false, undefined), 30000);
    assert.equal(supportPollInterval(false, "BOT"), 30000);
    assert.equal(supportPollInterval(false, "RESOLVED"), 30000);
    assert.equal(supportPollInterval(false, "QUEUED"), 2000);
    assert.equal(supportPollInterval(false, "HUMAN"), 2000);
    assert.equal(supportPollInterval(true, "BOT"), 2000);
  });
  it("supportFetch combina sinal do caller com timeout de 15s e aborta fetch pendente", async t => {
    const caller = new AbortController(), deadline = new AbortController(); let captured: RequestInit | undefined;
    const milliseconds: number[] = [];
    t.mock.method(AbortSignal, "timeout", (ms: number) => { milliseconds.push(ms); return deadline.signal; });
    t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
      captured = init;
      return new Promise<Response>((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason), { once: true }));
    });
    const request = supportFetch("/api/support/thread", undefined, "GET", caller.signal);
    assert.ok(captured?.signal); assert.notEqual(captured.signal, caller.signal); assert.deepEqual(milliseconds, [15000]);
    assert.equal(captured.method, "GET"); assert.equal(captured.credentials, "same-origin"); assert.equal(captured.cache, "no-store");
    caller.abort(new DOMException("Cancelled", "AbortError"));
    await assert.rejects(request, { name: "AbortError" }); assert.equal(captured.signal.aborted, true);
    const nextCaller = new AbortController();
    const nextRequest = supportFetch("/api/support/thread", undefined, "GET", nextCaller.signal);
    deadline.abort(new DOMException("Deadline", "TimeoutError"));
    await assert.rejects(nextRequest, { name: "TimeoutError" }); assert.equal(nextCaller.signal.aborted, false);
  });
});

const message = (id: string, createdAt: string, senderType: SupportMessageDTO["senderType"] = "USER"): SupportMessageDTO => ({ id, clientId: `client_${id}`, senderType, senderName: null, content: id, createdAt, readAt: null });
const snapshot = (lastMessageAt: string, messages: SupportMessageDTO[], status: SupportSnapshot["thread"]["status"] = "BOT", olderCursor: string | null = null): SupportSnapshot => ({ thread: { id: "thread", status, priority: "NORMAL", assignedOperator: null, assignedOperatorId: null, queuedAt: null, humanStartedAt: null, resolvedAt: null, unread: 0, lastMessageAt }, messages, olderCursor });

describe("histórico e deltas de polling", () => {
  it("delta preserva página antiga e substitui leitura sem duplicar mensagem", () => {
    const old = message("old", "2026-10-07T16:00:00.000Z"), latest = message("latest", "2026-10-07T17:00:00.000Z", "OPERATOR");
    const previous = snapshot(latest.createdAt, [old, latest], "HUMAN", "cursor_old");
    const read = { ...latest, readAt: "2026-10-07T17:01:00.000Z" };
    const next = mergeSnapshot(previous, snapshot(latest.createdAt, [read], "HUMAN"));
    assert.deepEqual(next.messages, [old, read]); assert.equal(new Set(next.messages.map(m => m.id)).size, 2);
  });
  it("resposta atrasada não reverte status humano ou perde histórico/delta mais recente", () => {
    const old = message("old", "2026-10-07T16:00:00.000Z"), latest = message("latest", "2026-10-07T17:00:00.000Z", "OPERATOR");
    const current = snapshot(latest.createdAt, [old, latest], "HUMAN", "cursor_old");
    const stale = snapshot(old.createdAt, [old], "BOT");
    assert.deepEqual(mergeSnapshot(current, stale), current);
    const pending: PendingMessage = { ...old, id: "pending_old", delivery: "failed" };
    assert.deepEqual(reconcileMessages(current.messages, [pending]), current.messages);
  });
});
