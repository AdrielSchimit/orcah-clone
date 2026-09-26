"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mascote, MascoteAvatar } from "@/components/mascote";
import {
  dicaDaTela,
  perguntasRapidas,
  type AssistenteContexto,
  type AssistenteFala,
} from "@/lib/assistente";

type Mensagem = { de: "assistente"; fala: AssistenteFala } | { de: "voce"; texto: string; id: string };

const VISTOS_KEY = "orcah-assistente-vistos";
const vistosEvent = "orcah-assistente-vistos";

function lerVistos(): string {
  try {
    return localStorage.getItem(VISTOS_KEY) ?? "";
  } catch {
    return "";
  }
}

function marcarVisto(id: string) {
  const atual = lerVistos().split(",").filter(Boolean);
  if (atual.includes(id)) return;
  try {
    localStorage.setItem(VISTOS_KEY, [...atual, id].slice(-40).join(","));
  } catch {
    // sem storage (aba privada, bloqueio): o ponto de aviso só não some
  }
  window.dispatchEvent(new Event(vistosEvent));
}

function assinarVistos(onChange: () => void) {
  window.addEventListener(vistosEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(vistosEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function Assistente({ contexto }: { contexto: AssistenteContexto }) {
  const pathname = usePathname();
  const dica = dicaDaTela(pathname, contexto);
  const [aberto, setAberto] = useState(false);
  const [conversa, setConversa] = useState<{ tela: string; mensagens: Mensagem[] }>({ tela: "", mensagens: [] });
  const vistos = useSyncExternalStore(assinarVistos, lerVistos, () => null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  // a conversa recomeça quando a tela muda (a dica é outra)
  const mensagens: Mensagem[] =
    conversa.tela === dica.id ? conversa.mensagens : [{ de: "assistente", fala: dica }];
  const ultimaFala = [...mensagens].reverse().find((m) => m.de === "assistente");
  const pose = ultimaFala?.de === "assistente" ? ultimaFala.fala.pose : dica.pose;
  const feitas = new Set(mensagens.flatMap((m) => (m.de === "voce" ? [m.id] : [])));
  const novidade = vistos !== null && !vistos.split(",").includes(dica.id);

  const jaAbriu = useRef(false);
  useEffect(() => {
    if (!aberto) {
      // devolve o foco ao botão só depois de ter aberto uma vez
      if (jaAbriu.current) botaoRef.current?.focus();
      return;
    }
    jaAbriu.current = true;
    fecharRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [mensagens.length]);

  function abrir() {
    setAberto(true);
    marcarVisto(dica.id);
  }

  function perguntar(id: string) {
    const item = perguntasRapidas.find((p) => p.id === id);
    if (!item) return;
    setConversa({
      tela: dica.id,
      mensagens: [...mensagens, { de: "voce", texto: item.pergunta, id: item.id }, { de: "assistente", fala: item.resposta }],
    });
  }

  // no celular, o formulário de orçamento tem barra fixa embaixo: o botão sai do caminho
  const escondeNoCelular = pathname.startsWith("/painel/orcamentos/");

  return (
    <>
      {aberto ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Assistente Orçah"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex max-h-[min(34rem,calc(100dvh-7rem))] animate-pop flex-col overflow-hidden rounded-box border border-line bg-card text-text shadow-float md:inset-x-auto md:bottom-6 md:right-6 md:w-96"
        >
          <div className="relative flex items-end gap-3 bg-gold-wash px-4 pt-4">
            <Mascote key={pose} pose={pose} className="h-28 w-auto shrink-0 animate-pop" />
            <div className="min-w-0 flex-1 pb-4">
              <p className="font-semibold">Assistente Orçah</p>
              <p className="text-xs text-text-soft">Dicas rápidas para você fechar mais</p>
            </div>
            <button
              ref={fecharRef}
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar assistente"
              className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-card/70"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {mensagens.map((m, i) =>
              m.de === "voce" ? (
                <p
                  key={`${m.id}-${i}`}
                  className="ml-auto w-fit max-w-[85%] animate-rise rounded-box rounded-br-md bg-ink px-4 py-2.5 text-sm text-ink-text"
                >
                  {m.texto}
                </p>
              ) : (
                <div key={`${m.fala.id}-${i}`} className="flex max-w-[92%] animate-rise items-end gap-2">
                  <MascoteAvatar className="h-8 w-8 shrink-0" />
                  <div className="rounded-box rounded-bl-md bg-paper px-4 py-2.5 text-sm">
                    <p>{m.fala.texto}</p>
                    {m.fala.acao ? (
                      <Link
                        href={m.fala.acao.href}
                        onClick={() => setAberto(false)}
                        className="mt-2 inline-flex min-h-10 items-center rounded-btn bg-gold px-3 text-sm font-semibold text-ink"
                      >
                        {m.fala.acao.label}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ),
            )}
            <div ref={fimRef} />
          </div>

          {perguntasRapidas.some((p) => !feitas.has(p.id)) ? (
            <div className="border-t border-line px-4 py-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Perguntas rápidas</p>
              <div className="flex flex-wrap gap-2">
                {perguntasRapidas
                  .filter((p) => !feitas.has(p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => perguntar(p.id)}
                      className="min-h-10 rounded-full border border-gold/50 bg-card px-3 text-left text-sm font-medium hover:bg-gold-wash"
                    >
                      {p.pergunta}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          ref={botaoRef}
          type="button"
          onClick={abrir}
          aria-label={novidade ? "Abrir assistente (dica nova)" : "Abrir assistente"}
          className={`fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-gold-wash shadow-float transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6 md:flex ${
            escondeNoCelular ? "hidden" : "flex"
          }`}
        >
          <MascoteAvatar className="h-full w-full" />
          {novidade ? (
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-card bg-no" aria-hidden />
          ) : null}
        </button>
      )}
    </>
  );
}
