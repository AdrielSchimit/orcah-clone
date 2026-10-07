"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MascoteAvatar } from "@/components/mascote";
import type { AssistenteContexto } from "@/lib/assistente";
import { useSupportThread } from "@/lib/support/use-support-thread";
import { MESSAGE_MAX_LENGTH } from "@/lib/support/types";
import type { PendingMessage } from "@/lib/support/reconcile";
import styles from "./support-chat.module.css";

const suggestions = ["Como criar um orçamento?", "Como configurar minha página?", "Como adicionar um serviço?", "Como funciona meu plano?"];
const time = (value: string) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export function Assistente({ contexto }: { contexto: AssistenteContexto }) {
  void contexto;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const pathname = usePathname();
  const chat = useSupportThread(pathname, open);
  const launcher = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const thread = chat.snapshot?.thread;
  const status = thread?.status || "BOT";
  const indicator = status === "HUMAN" ? `Atendimento com ${thread?.assignedOperator}` : status === "QUEUED" ? "Na fila para atendimento" : status === "RESOLVED" ? "Atendimento resolvido" : "Assistente virtual";

  useEffect(() => {
    if (!open) { if (wasOpen.current) launcher.current?.focus(); return; }
    wasOpen.current = true; close.current?.focus();
    const original = document.body.style.overflow; document.body.style.overflow = "hidden";
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      const nodes = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = original; document.removeEventListener("keydown", keydown); };
  }, [open]);
  const lastId = chat.messages.at(-1)?.id;
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: "nearest" }); }, [open, lastId]);

  function submit() {
    if (!draft.trim() || chat.busy || !thread) return;
    const content = draft.trim(); setDraft(""); void chat.send(content);
  }
  return <>
    <button ref={launcher} type="button" onClick={() => setOpen(true)} className={styles.launcher} aria-label={`Abrir Assistente ORÇAH${thread?.unread ? `, ${thread.unread} mensagens novas` : ""}`} aria-expanded={open} aria-controls="orcah-support-chat" hidden={open}>
      <MascoteAvatar className="h-full w-full" />
      {Boolean(thread?.unread) && <span className={styles.badge}>{Math.min(thread!.unread, 99)}</span>}
    </button>
    {!open && status === "HUMAN" && Boolean(thread?.unread) && <button type="button" className={styles.notice} onClick={() => setOpen(true)}>{indicator} · Ver conversa</button>}
    <span className="sr-only" role="status">{indicator}{thread?.unread ? `, ${thread.unread} mensagens novas` : ""}</span>
    {open && <>
      <button className={styles.backdrop} type="button" tabIndex={-1} aria-label="Fechar conversa" onClick={() => setOpen(false)} />
      <section ref={dialog} id="orcah-support-chat" className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="support-title">
        <header className={styles.header}>
          <MascoteAvatar className="h-12 w-12 shrink-0" />
          <div className={styles.identity}><h2 id="support-title">Assistente ORÇAH</h2><p><span className={styles.dot} data-human={status === "HUMAN"} />{indicator}</p></div>
          <button ref={close} type="button" onClick={() => setOpen(false)} className={styles.iconButton} aria-label="Fechar assistente">×</button>
        </header>
        {!chat.connected && <p className={styles.connection} role="status">Reconectando ao suporte…</p>}
        <div className={styles.history} role="log" aria-label="Histórico da conversa" aria-live="polite" aria-relevant="additions text">
          {chat.snapshot?.olderCursor && <button type="button" className={styles.older} disabled={chat.busy} onClick={() => void chat.older()}>Ver mensagens anteriores</button>}
          {!chat.messages.length && <div className={styles.welcome}><MascoteAvatar className="mx-auto h-20 w-20" /><h3>Como posso ajudar?</h3><p>Tire dúvidas sobre o ORÇAH ou fale com uma pessoa. Sua conversa fica salva aqui.</p></div>}
          {chat.messages.map(m => m.senderType === "SYSTEM" ? <p key={m.id} className={styles.system}>{m.content}</p> : <div key={m.id} className={styles.message} data-sender={m.senderType}>
            <span className={styles.sender}>{m.senderType === "USER" ? "Você" : m.senderType === "ASSISTANT" ? "Assistente ORÇAH" : m.senderName}</span>
            <p>{m.content}</p>
            <span className={styles.time}>{time(m.createdAt)}{"delivery" in m && m.delivery === "sending" ? " · Enviando…" : ""}</span>
            {"delivery" in m && m.delivery === "failed" && <button type="button" className={styles.retry} disabled={chat.busy} onClick={() => void chat.send(m.content, m as PendingMessage)}>Não enviada · Tentar novamente</button>}
          </div>)}
          <div ref={end} />
        </div>
        {status === "BOT" && chat.messages.length < 3 && <div className={styles.suggestions}>{suggestions.map(text => <button key={text} type="button" disabled={chat.busy || !thread} onClick={() => void chat.send(text)}>{text}</button>)}</div>}
        {chat.error && <p className={styles.error} role="alert">{chat.error}</p>}
        <div className={styles.handoff}>
          {status === "BOT" || status === "RESOLVED" ? <button type="button" disabled={chat.busy || !thread} onClick={() => void chat.action("escalate")}>Falar com uma pessoa</button> : status === "QUEUED" ? <><span>Você pode continuar usando o ORÇAH.</span><button type="button" disabled={chat.busy} onClick={() => void chat.action("cancel-human")}>Cancelar e voltar ao assistente</button></> : <span>A pessoa do suporte continua nesta conversa.</span>}
          {status === "RESOLVED" && <button type="button" disabled={chat.busy} onClick={() => void chat.action("return-to-bot")}>Voltar ao assistente</button>}
        </div>
        <form className={styles.composer} onSubmit={e => { e.preventDefault(); submit(); }}>
          <label className="sr-only" htmlFor="support-draft">Sua mensagem</label>
          <textarea id="support-draft" value={draft} onChange={e => setDraft(e.target.value)} maxLength={MESSAGE_MAX_LENGTH} rows={2} placeholder={status === "RESOLVED" ? "Volte ao assistente para conversar" : "Escreva sua mensagem…"} disabled={status === "RESOLVED" || !thread} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }} />
          <button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || chat.busy || !thread || status === "RESOLVED"}>↑</button>
          <span className={styles.count}>{draft.length}/{MESSAGE_MAX_LENGTH}</span>
        </form>
      </section>
    </>}
  </>;
}
