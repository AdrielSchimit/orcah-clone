"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { mergeSnapshot, mutationSnapshot, reconcileMessages, type PendingMessage } from "./reconcile";
import { pollingTransport, supportFetch } from "./transport";
import type { SupportSnapshot, SupportStatus } from "./types";

// A closed chat in BOT/RESOLVED only changes through this user's own actions, so idle panel tabs poll slowly.
export function supportPollInterval(open: boolean, status?: SupportStatus) {
  return open || status === "QUEUED" || status === "HUMAN" ? 2000 : 30000;
}

export function useSupportThread(route: string, visible: boolean) {
  const [snapshot, setSnapshot] = useState<SupportSnapshot | null>(null);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastRead = useRef("");
  const latestMessage = useRef("");
  const threadId = useRef("");
  const refresh = useCallback(async (signal: AbortSignal) => {
    const after = latestMessage.current;
    // Known thread id skips the server-side upsert on every poll.
    const query = new URLSearchParams({ ...(threadId.current ? { threadId: threadId.current } : {}), ...(after ? { after } : {}) }).toString();
    const next = await supportFetch<SupportSnapshot>(`/api/support/thread${query ? `?${query}` : ""}`, undefined, "GET", signal);
    if (signal.aborted) return;
    threadId.current = next.thread.id;
    latestMessage.current = next.messages.at(-1)?.id || after;
    setSnapshot(old => mergeSnapshot(old, next)); setError("");
    setPending(old => old.filter(p => !next.messages.some(m => m.senderType === "USER" && m.clientId === p.clientId)));
  }, []);
  const interval = supportPollInterval(visible, snapshot?.thread.status);
  useEffect(() => pollingTransport(interval).subscribe(refresh, setConnected), [refresh, interval]);
  const throughId = snapshot?.messages.at(-1)?.id;
  useEffect(() => {
    if (!visible || !snapshot || !throughId || !snapshot.thread.unread || lastRead.current === throughId) return;
    let disposed = false;
    let request: AbortController | undefined;
    const acknowledge = () => {
      request?.abort();
      if (document.visibilityState === "hidden" || !navigator.onLine) return;
      const controller = new AbortController(); request = controller;
      void supportFetch("/api/support/read", { threadId: snapshot.thread.id, throughId }, "POST", controller.signal).then(() => { if (!disposed && !controller.signal.aborted) lastRead.current = throughId; }).catch(() => {});
    };
    acknowledge(); document.addEventListener("visibilitychange", acknowledge);
    return () => { disposed = true; request?.abort(); document.removeEventListener("visibilitychange", acknowledge); };
  }, [visible, snapshot, throughId]);

  async function send(content: string, retry?: PendingMessage) {
    if (!snapshot || busy) return;
    const clientId = retry?.clientId || crypto.randomUUID();
    const optimistic: PendingMessage = { id: `pending_${clientId}`, clientId, senderType: "USER", senderName: null, content, createdAt: retry?.createdAt || new Date().toISOString(), readAt: null, delivery: "sending", route: retry?.route || route };
    setPending(old => [...old.filter(m => m.clientId !== clientId), optimistic]); setBusy(true); setError("");
    try {
      const next = await supportFetch<SupportSnapshot>("/api/support/messages", { threadId: snapshot.thread.id, clientId, content, route: optimistic.route });
      setSnapshot(old => mergeSnapshot(old, mutationSnapshot(next)));
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao enviar."); setPending(old => old.map(m => m.clientId === clientId ? { ...m, delivery: "failed" } : m)); }
    finally { setBusy(false); }
  }
  async function action(action: "escalate" | "cancel-human" | "return-to-bot") {
    if (!snapshot || busy) return;
    setBusy(true); setError("");
    try { const next = await supportFetch<SupportSnapshot>(`/api/support/${action}`, { threadId: snapshot.thread.id }); setSnapshot(old => mergeSnapshot(old, mutationSnapshot(next))); }
    catch (e) { setError(e instanceof Error ? e.message : "Falha ao atualizar."); }
    finally { setBusy(false); }
  }
  async function older() {
    if (!snapshot?.olderCursor || busy) return;
    setBusy(true);
    try {
      const next = await supportFetch<SupportSnapshot>(`/api/support/thread?threadId=${encodeURIComponent(snapshot.thread.id)}&before=${encodeURIComponent(snapshot.olderCursor)}`);
      setSnapshot(old => ({ ...mergeSnapshot(old, next), olderCursor: next.olderCursor }));
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao carregar histórico."); }
    finally { setBusy(false); }
  }
  return { snapshot, messages: reconcileMessages(snapshot?.messages || [], pending), error, connected, busy, send, action, older };
}
