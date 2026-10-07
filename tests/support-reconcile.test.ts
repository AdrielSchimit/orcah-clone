import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeSnapshot, mutationSnapshot, reconcileMessages, type PendingMessage } from "../src/lib/support/reconcile";
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
  it("preserva página histórica com header atrasado sem reverter o atendimento recente", () => {
    const current = { ...snapshot("2026-10-07T17:00:00.000Z"), thread: { ...snapshot("2026-10-07T17:00:00.000Z").thread, status: "HUMAN" as const }, olderCursor: "cursor_current" };
    const historical = { ...message, id: "history_1", clientId: "history_request", createdAt: "2026-10-06T15:00:00.000Z" };
    const oldPage = { ...snapshot("2026-10-07T16:00:00.000Z"), messages: [historical], olderCursor: "cursor_older" };
    const merged = mergeSnapshot(current, oldPage);
    assert.deepEqual(merged.thread, current.thread);
    assert.deepEqual(merged.messages, [historical, message]);
    assert.equal(merged.olderCursor, current.olderCursor, "caller de histórico decide quando avançar o cursor antigo");
  });
  it("readAt nunca regride quando um poll antigo ou mensagem duplicada chega depois", () => {
    const read = { ...message, readAt: "2026-10-07T17:01:00.000Z" };
    const current = { ...snapshot("2026-10-07T17:00:00.000Z"), messages: [read] };
    const stale = { ...snapshot("2026-10-07T16:00:00.000Z"), messages: [{ ...message, readAt: null }] };
    assert.equal(mergeSnapshot(current, stale).messages[0].readAt, read.readAt);
    assert.equal(mergeSnapshot(current, { ...current, messages: [{ ...message, readAt: null }] }).messages[0].readAt, read.readAt);
  });
  it("delta incremental conserva olderCursor e histórico, inclusive quando vem vazio", () => {
    const current = { ...snapshot("2026-10-07T17:00:00.000Z"), olderCursor: "history_cursor" };
    const newMessage = { ...message, id: "delta_2", clientId: "request_2", createdAt: "2026-10-07T17:01:00.000Z" };
    const delta = { ...snapshot(newMessage.createdAt), messages: [newMessage], olderCursor: null, incremental: true };
    const merged = mergeSnapshot(current, delta);
    assert.equal(merged.olderCursor, "history_cursor"); assert.deepEqual(merged.messages, [message, newMessage]);
    const empty = mergeSnapshot(merged, { ...delta, messages: [] });
    assert.deepEqual(empty.messages, merged.messages); assert.equal(empty.olderCursor, "history_cursor");
  });
  it("mutação atualiza header sem trocar histórico/cursor nem remover pending antes do poll", () => {
    const current = { ...snapshot("2026-10-07T16:00:00.000Z"), olderCursor: "history_cursor" };
    const persisted = { ...message, id: "saved_2", clientId: "request_2", content: "Mensagem nova", createdAt: "2026-10-07T17:00:00.000Z" };
    const pending: PendingMessage = { ...persisted, id: "pending_2", delivery: "sending" };
    const response = { ...snapshot(persisted.createdAt), thread: { ...snapshot(persisted.createdAt).thread, status: "QUEUED" as const }, messages: [persisted], olderCursor: "newest_page_cursor", context: { company: "Empresa" } };
    const mutation = mutationSnapshot(response);
    assert.deepEqual(mutation.messages, []); assert.equal(mutation.incremental, true);
    assert.deepEqual(mutation.context, response.context, "metadata do Control permanece disponível");
    assert.deepEqual(response.messages, [persisted], "não modifica a resposta recebida");
    const afterMutation = mergeSnapshot(current, mutation);
    assert.equal(afterMutation.thread.status, "QUEUED"); assert.equal(afterMutation.thread.lastMessageAt, persisted.createdAt);
    assert.deepEqual(afterMutation.messages, current.messages); assert.equal(afterMutation.olderCursor, "history_cursor");
    assert.deepEqual(reconcileMessages(afterMutation.messages, [pending]), [message, pending]);
    const afterPoll = mergeSnapshot(afterMutation, { ...response, incremental: true });
    assert.deepEqual(reconcileMessages(afterPoll.messages, [pending]), [message, persisted]);
    assert.equal(afterPoll.olderCursor, "history_cursor");
  });
});
