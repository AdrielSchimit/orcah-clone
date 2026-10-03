"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { appUrl } from "@/lib/urls";

const STORAGE_KEY = "orcah-home-entry-dismissed";

const journeyCardClass =
  "group relative flex min-h-[7.5rem] flex-col rounded-2xl border border-line bg-card p-4 shadow-card transition-all duration-200 ease-soft hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:min-h-0 sm:p-5";

export function HomeEntryModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-entry-title"
      aria-describedby="home-entry-desc"
    >
      <button
        type="button"
        aria-label="Fechar e ir ao site"
        className="absolute inset-0 bg-ink/32 backdrop-blur-[3px] transition-opacity"
        onClick={dismiss}
      />
      <div className="relative w-full max-w-[720px] animate-modal-enter rounded-3xl border border-line bg-card px-6 py-8 shadow-float sm:px-10 sm:py-9">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-deep">Bem-vindo ao Orçah</p>
          <h2 id="home-entry-title" className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-[1.625rem]">
            O que você quer fazer?
          </h2>
          <p id="home-entry-desc" className="mt-1.5 text-sm text-text-soft">
            Escolha como deseja acessar o Orçah.
          </p>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
          <Link
            href="/prestadores"
            onClick={dismiss}
            className={`${journeyCardClass} hover:border-gold hover:bg-gold-wash/40`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-gold-wash text-gold-deep transition-colors duration-200 group-hover:bg-gold-wash group-hover:text-gold-press">
              <SearchIcon />
            </span>
            <span className="mt-3 flex items-start justify-between gap-2">
              <span className="font-semibold leading-snug text-text">Encontrar Profissionais</span>
              <ArrowIcon className="mt-0.5 shrink-0 text-text-soft opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gold-deep group-hover:opacity-100" />
            </span>
            <span className="mt-1 text-sm leading-snug text-text-soft">
              Encontre prestadores de confiança na sua região.
            </span>
          </Link>

          <Link
            href={appUrl("/login")}
            onClick={dismiss}
            className={`${journeyCardClass} hover:border-ink-line hover:bg-brand-wash/50`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-brand-wash text-ink transition-colors duration-200 group-hover:bg-brand-wash group-hover:text-ink-deep">
              <PanelIcon />
            </span>
            <span className="mt-3 flex items-start justify-between gap-2">
              <span className="font-semibold leading-snug text-text">Área do Prestador</span>
              <ArrowIcon className="mt-0.5 shrink-0 text-text-soft opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink group-hover:opacity-100" />
            </span>
            <span className="mt-1 text-sm leading-snug text-text-soft">
              Gerencie orçamentos, clientes, serviços e sua página.
            </span>
          </Link>
        </div>

        <footer className="mt-5 border-t border-line/80 pt-4">
          <button
            type="button"
            onClick={dismiss}
            className="group/more mx-auto flex min-h-11 items-center gap-1 text-sm font-medium text-text-soft transition-colors duration-200 hover:text-gold-deep"
          >
            Continuar para o site
            <span
              className="inline-block transition-transform duration-200 group-hover/more:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}
