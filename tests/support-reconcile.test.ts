import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeSnapshot, reconcileMessages, type PendingMessage } from "../src/lib/support/reconcile";
import type { SupportMessageDTO, SupportSnapshot } from "../src/lib/support/types";
const message: SupportMessageDTO = { id: "server_1", clientId: "request_1", content: "Oi", senderType: "USER", senderName: null, createdAt: "2026-10-07T16:00:00.000Z", readAt: null };
const snapshot = (lastMessageAt: string): SupportSnapshot => ({ thread: { id: "thread", status: "BOT", priority: "NORMAL", assignedOperator: null, assignedOperatorId: null, queuedAt: null, humanStartedAt: null, resolvedAt: null, unread: 0, lastMessageAt }, messages: [message], olderCursor: null });
describe("reconciliação do transporte", () => {
  it("troca mensagem otimista pela persistida sem duplicar", () => {
    const pending: PendingMessage = { ...message, id: "pending_1", delivery: "sending" };
    assert.deepEqual(reconcileMessages([message], [pending]), [message]);
    assert.equal(reconcileMessages([], [{ ...pending, delivery: "failed" }]).length, 1);
  });
  it("mantém mensagens históricas e rejeita estado atrasado de polling", () => {
    const current = snapshot("2026-10-07T17:00:00.000Z");
    const stale = { ...snapshot("2026-10-07T16:00:00.000Z"), messages: [] };
    assert.deepEqual(mergeSnapshot(current, stale), current);
    const next = { ...current, messages: [{ ...message, id: "server_2", clientId: "request_2" }] };
    assert.equal(mergeSnapshot(current, next).messages.length, 2);
  });
});
