"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";

const SESSION_KEY = "orcah-robo-prompt";
const noopSubscribe = () => () => {};

/** Convite para ligar o WhatsApp automático. Aparece até conectar ou marcar "Não mostrar novamente". */
function seenThisSession() {
  try {
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

export function WhatsAppRobotPrompt({ show }: { show: boolean }) {
  // no servidor conta como "já visto": o modal só abre no navegador
  const seen = useSyncExternalStore(noopSubscribe, seenThisSession, () => true);
  const [closed, setClosed] = useState(false);
  const open = show && !seen && !closed;
  const [hide, setHide] = useState(false);
  const firstButton = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) firstButton.current?.focus();
  }, [open]);

  // sem lista de dependências: o Esc precisa ver o "hide" atual
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function close() {
    setClosed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    if (hide) fetch("/api/whatsapp", { method: "POST", body: JSON.stringify({ action: "hide-prompt" }) }).catch(() => {});
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="robo-title"
        className="w-full max-w-sm rounded-box bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="robo-title" className="text-lg font-semibold">
          Mandar automático pelo WhatsApp?
        </h2>
        <p className="mt-2 text-sm text-text-soft">
          Conecte seu WhatsApp uma vez lendo um QR Code. Depois, orçamentos e cotações saem sozinhos, sem abrir conversa
          por conversa.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            ref={firstButton}
            href="/painel/conta#whatsapp"
            onClick={close}
            className="flex min-h-12 items-center justify-center rounded-btn bg-gold px-4 text-sm font-semibold text-ink"
          >
            Conectar meu WhatsApp
          </Link>
          <button type="button" onClick={close} className="min-h-12 rounded-btn border border-line px-4 text-sm font-medium">
            Continuar no manual
          </button>
        </div>
        <label className="mt-4 flex min-h-10 items-center gap-2 text-sm text-text-soft">
          <input type="checkbox" checked={hide} onChange={(event) => setHide(event.target.checked)} className="h-5 w-5" />
          Não mostrar novamente
        </label>
      </div>
    </div>
  );
}

type State = "open" | "connecting" | "close";

/** Card de Conta: conecta (QR Code) ou desconecta o WhatsApp automático. */
export function WhatsAppRobotCard() {
  const [state, setState] = useState<State | null>(null);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // na abertura e, enquanto o QR está na tela, a cada 3s até conectar
  useEffect(() => {
    const check = () =>
      fetch("/api/whatsapp", { cache: "no-store" })
        .then((r) => r.json() as Promise<{ state?: State }>)
        .then((data) => {
          if (!data.state) return;
          setState(data.state);
          if (data.state === "open") setQr("");
        })
        .catch(() => {});
    check();
    if (!qr) return;
    const timer = window.setInterval(check, 3000);
    return () => window.clearInterval(timer);
  }, [qr]);

  async function act(action: "qr" | "logout") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/whatsapp", { method: "POST", body: JSON.stringify({ action }) });
      const data = (await response.json().catch(() => ({}))) as { qr?: string; error?: string };
      if (!response.ok) setError(data.error ?? "Não deu certo. Tente de novo.");
      else if (action === "qr") setQr(data.qr ?? "");
      else {
        setQr("");
        setState("close");
      }
    } catch {
      setError("Sem internet agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  const connected = state === "open";
  return (
    <div>
      <p className="text-sm" role="status">
        {state == null ? "Verificando…" : connected ? "Conectado. Orçamentos e cotações saem automático." : "Desligado. Você manda pelo link, um por um."}
      </p>
      {qr ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR Code para conectar o WhatsApp" className="h-56 w-56" />
          <p className="text-center text-sm text-text-soft">
            No celular: WhatsApp › Aparelhos conectados › Conectar aparelho. Aponte para o código.
          </p>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-no">{error}</p> : null}
      <button
        type="button"
        disabled={busy || state == null}
        onClick={() => act(connected ? "logout" : "qr")}
        className={`mt-3 flex min-h-12 w-full items-center justify-center rounded-btn px-4 text-sm font-semibold disabled:opacity-60 ${
          connected ? "border border-line text-no" : "bg-zap text-ink"
        }`}
      >
        {busy ? "Aguarde…" : connected ? "Desconectar" : qr ? "Gerar outro QR Code" : "Conectar com QR Code"}
      </button>
    </div>
  );
}
