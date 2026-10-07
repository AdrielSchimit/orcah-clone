import type { SupportMessageDTO, SupportSnapshot } from "./types";
export type PendingMessage = SupportMessageDTO & { delivery: "sending" | "failed"; route?: string };
export function reconcileMessages(server: SupportMessageDTO[], pending: PendingMessage[]) {
  const remaining = pending.filter(p => !server.some(m => m.senderType === p.senderType && m.clientId === p.clientId));
  return [...server, ...remaining].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
export function mergeSnapshot(previous: SupportSnapshot | null, next: SupportSnapshot): SupportSnapshot {
  if (!previous || previous.thread.id !== next.thread.id) return next;
  if (previous.thread.lastMessageAt > next.thread.lastMessageAt) return previous;
  const all = new Map(previous.messages.map(m => [m.id, m]));
  for (const message of next.messages) all.set(message.id, message);
  return { ...next, messages: [...all.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)), olderCursor: previous.messages.length > 100 ? previous.olderCursor : next.olderCursor };
}
