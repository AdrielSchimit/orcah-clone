"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { appUrl } from "@/lib/urls";

const STORAGE_KEY = "orcah-home-entry-dismissed";

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
    >
      <button
        type="button"
        aria-label="Fechar e ir ao site"
        className="absolute inset-0 bg-ink/40 backdrop-blur-md"
        onClick={dismiss}
      />
      <div className="relative w-full max-w-2xl animate-rise rounded-[1.75rem] bg-card p-6 shadow-float ring-1 ring-line md:p-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Bem-vindo ao Orçah</p>
        <h2 id="home-entry-title" className="mt-2 text-center text-xl font-semibold text-text md:text-2xl">
          O que você procura?
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/prestadores"
            onClick={dismiss}
            className="group flex min-h-38 flex-col rounded-box border border-line bg-paper p-5 shadow-card transition-shadow hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-gold-wash text-gold-deep">
              <SearchIcon />
            </span>
            <span className="mt-4 text-base font-semibold leading-snug text-text group-hover:text-gold-deep">
              Pesquisar Prestadores em sua Região
            </span>
            <span className="mt-1 text-sm text-text-soft">Encontre profissionais perto de você</span>
          </Link>
          <Link
            href={appUrl("/login")}
            onClick={dismiss}
            className="group flex min-h-38 flex-col rounded-box border border-line bg-paper p-5 shadow-card transition-shadow hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-brand-wash text-ink">
              <PanelIcon />
            </span>
            <span className="mt-4 text-base font-semibold leading-snug text-text group-hover:text-gold-deep">
              Painel do Prestador
            </span>
            <span className="mt-1 text-sm text-text-soft">Orçamentos, página e clientes</span>
          </Link>
        </div>
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-12 items-center rounded-btn px-6 text-sm font-semibold text-text-soft underline-offset-4 hover:text-text hover:underline"
          >
            Ir ao Site
          </button>
        </div>
      </div>
    </div>
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
