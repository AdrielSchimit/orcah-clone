"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type HomeIntent = "search" | "provider";

const STORAGE_KEY = "orcah-home-intent-v1";

export function HomeProviderSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [intent, setIntent] = useState<HomeIntent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "search" || saved === "provider") {
      setIntent(saved);
    }
    setHydrated(true);
  }, []);

  function chooseIntent(next: HomeIntent) {
    setIntent(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    if (next === "search") {
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }

  function clearIntent() {
    setIntent(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("servico") ?? "").trim();
    window.localStorage.setItem(STORAGE_KEY, "search");

    if (!text) {
      router.push("/prestadores");
      return;
    }

    const params = new URLSearchParams();
    params.set("servico", text.toLowerCase());
    params.set("ordenar", "relevancia");
    router.push(`/prestadores?${params.toString()}`);
  }

  function goToProvider(path: "/painel" | "/cadastro") {
    window.localStorage.setItem(STORAGE_KEY, "provider");
    router.push(path);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-[22px] border border-line bg-card shadow-[0_18px_50px_-34px_rgba(15,23,42,.38)]">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-wash text-gold-deep">
                <SparkIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{intent ? (intent === "search" ? "Encontrar um profissional" : "Área do prestador") : "O que você quer fazer?"}</p>
                <p className="mt-0.5 text-xs text-text-soft">
                  {intent === "search"
                    ? "Digite o serviço e encontre profissionais na sua região."
                    : intent === "provider"
                      ? "Acesse seu painel ou crie sua página profissional."
                      : "Escolha uma opção — o Orçah lembra disso na próxima visita."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => chooseIntent("search")}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
                intent === "search"
                  ? "border-gold/30 bg-gold-wash text-gold-deep shadow-[0_8px_20px_-16px_rgba(229,153,26,.9)]"
                  : "border-line bg-paper/70 text-text hover:border-gold/30 hover:bg-gold-wash/60 hover:text-ink"
              }`}
            >
              <SearchIcon compact />
              Quero contratar
            </button>
            <button
              type="button"
              onClick={() => chooseIntent("provider")}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
                intent === "provider"
                  ? "border-ink/15 bg-ink text-ink-text shadow-card"
                  : "border-line bg-paper/70 text-text hover:border-ink/15 hover:bg-ink hover:text-ink-text"
              }`}
            >
              <PanelIcon />
              Sou prestador
            </button>
          </div>
        </div>

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${hydrated && intent ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="border-t border-line/80 bg-paper/45 px-4 py-4 sm:px-5">
              {intent === "search" ? (
                <form action="/prestadores" method="get" onSubmit={onSubmit}>
                  <div className="flex h-12 items-center rounded-[14px] border border-line bg-card shadow-[0_2px_8px_rgba(15,23,42,.04)] focus-within:border-gold-deep focus-within:ring-[3px] focus-within:ring-gold-deep/20 md:h-[52px]">
                    <label htmlFor="home-busca" className="sr-only">Pesquise profissionais</label>
                    <SearchIcon />
                    <input
                      ref={inputRef}
                      id="home-busca"
                      name="servico"
                      placeholder="Ex.: eletricista, pintor, fotógrafo..."
                      autoComplete="off"
                      className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-text outline-none placeholder:text-text-soft sm:text-base"
                    />
                    <input type="hidden" name="ordenar" value="relevancia" />
                    <button
                      type="submit"
                      className="mr-[5px] inline-flex h-9 shrink-0 items-center rounded-[10px] bg-gold px-3.5 text-sm font-semibold text-ink transition hover:bg-gold-press md:h-10 md:px-[18px]"
                    >
                      Buscar
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px] text-text-soft">
                    <span>Você pode pesquisar por profissão ou tipo de serviço.</span>
                    <button type="button" onClick={clearIntent} className="shrink-0 font-semibold hover:text-ink">Trocar escolha</button>
                  </div>
                </form>
              ) : intent === "provider" ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Sua operação continua daqui.</p>
                    <p className="mt-1 text-xs text-text-soft">Orçamentos, clientes, serviços e sua página em um só painel.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => goToProvider("/painel")}
                      className="inline-flex min-h-10 items-center justify-center rounded-[12px] bg-ink px-4 text-sm font-semibold text-ink-text transition hover:-translate-y-0.5"
                    >
                      Acessar meu painel
                    </button>
                    <button
                      type="button"
                      onClick={() => goToProvider("/cadastro")}
                      className="inline-flex min-h-10 items-center justify-center rounded-[12px] bg-gold px-4 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-gold-press"
                    >
                      Começar grátis
                    </button>
                    <button type="button" onClick={clearIntent} className="px-2 text-xs font-semibold text-text-soft hover:text-ink">Trocar</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ compact = false }: { compact?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={compact ? "h-4 w-4" : "ml-4 h-[18px] w-[18px] shrink-0 text-text-soft"} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1L6.5 8.5l4.1-1.4L12 3Z" strokeLinejoin="round" />
      <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" strokeLinejoin="round" />
    </svg>
  );
}
