import type { SupportMessageDTO, SupportSnapshot } from "./types";
export type PendingMessage = SupportMessageDTO & { delivery: "sending" | "failed"; route?: string };
export function reconcileMessages(server: SupportMessageDTO[], pending: PendingMessage[]) {
  const remaining = pending.filter(p => !server.some(m => m.senderType === p.senderType && m.clientId === p.clientId));
  return [...server, ...remaining].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
export function mergeSnapshot(previous: SupportSnapshot | null, next: SupportSnapshot): SupportSnapshot {
  if (!previous || previous.thread.id !== next.thread.id) return next;
  const latest = previous.thread.lastMessageAt > next.thread.lastMessageAt ? previous : next;
  const all = new Map(previous.messages.map(m => [m.id, m]));
  for (const message of next.messages) all.set(message.id, { ...message, readAt: all.get(message.id)?.readAt || message.readAt });
  return { ...next, thread: latest.thread, messages: [...all.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)), olderCursor: previous.messages.length || next.incremental ? previous.olderCursor : next.olderCursor };
}
// Mutations return the latest page, which can skip a gap after a long disconnection.
// Synchronization advances only through polling; optimistic messages stay until then.
export function mutationSnapshot<T extends SupportSnapshot>(next: T): T {
  return { ...next, messages: [], incremental: true };
}
