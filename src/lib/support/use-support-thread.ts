"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { mergeSnapshot, reconcileMessages, type PendingMessage } from "./reconcile";
import { pollingTransport, supportFetch } from "./transport";
import type { SupportSnapshot } from "./types";

export function useSupportThread(route: string, visible: boolean) {
  const [snapshot, setSnapshot] = useState<SupportSnapshot | null>(null);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastRead = useRef("");
  const refresh = useCallback(async (signal: AbortSignal) => {
    const next = await supportFetch<SupportSnapshot>("/api/support/thread");
    if (signal.aborted) return;
    setSnapshot(old => mergeSnapshot(old, next)); setError("");
    setPending(old => old.filter(p => !next.messages.some(m => m.senderType === "USER" && m.clientId === p.clientId)));
  }, []);
  useEffect(() => pollingTransport().subscribe(refresh, setConnected), [refresh]);
  const throughId = snapshot?.messages.at(-1)?.id;
  useEffect(() => {
    if (!visible || !snapshot || !throughId || !snapshot.thread.unread || lastRead.current === throughId) return;
    let disposed = false;
    const acknowledge = () => {
      if (document.visibilityState === "hidden") return;
      void supportFetch("/api/support/read", { threadId: snapshot.thread.id, throughId }).then(() => { if (!disposed) lastRead.current = throughId; }).catch(() => {});
    };
    acknowledge(); document.addEventListener("visibilitychange", acknowledge);
    return () => { disposed = true; document.removeEventListener("visibilitychange", acknowledge); };
  }, [visible, snapshot, throughId]);

  async function send(content: string, retry?: PendingMessage) {
    if (!snapshot || busy) return;
    const clientId = retry?.clientId || crypto.randomUUID();
    const optimistic: PendingMessage = { id: `pending_${clientId}`, clientId, senderType: "USER", senderName: null, content, createdAt: retry?.createdAt || new Date().toISOString(), readAt: null, delivery: "sending", route: retry?.route || route };
    setPending(old => [...old.filter(m => m.clientId !== clientId), optimistic]); setBusy(true); setError("");
    try {
      const next = await supportFetch<SupportSnapshot>("/api/support/messages", { threadId: snapshot.thread.id, clientId, content, route: optimistic.route });
      setSnapshot(old => mergeSnapshot(old, next)); setPending(old => old.filter(m => m.clientId !== clientId));
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao enviar."); setPending(old => old.map(m => m.clientId === clientId ? { ...m, delivery: "failed" } : m)); }
    finally { setBusy(false); }
  }
  async function action(action: "escalate" | "cancel-human" | "return-to-bot") {
    if (!snapshot || busy) return;
    setBusy(true); setError("");
    try { const next = await supportFetch<SupportSnapshot>(`/api/support/${action}`, { threadId: snapshot.thread.id }); setSnapshot(old => mergeSnapshot(old, next)); }
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
