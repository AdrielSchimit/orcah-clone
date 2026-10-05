"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export function HomeProviderSearch() {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("servico") ?? "").trim();
    if (!text) {
      router.push("/prestadores");
      return;
    }
    const params = new URLSearchParams();
    params.set("servico", text.toLowerCase());
    params.set("ordenar", "relevancia");
    router.push(`/prestadores?${params.toString()}`);
  }

  return (
    <form action="/prestadores" method="get" onSubmit={onSubmit} className="mx-auto w-full max-w-5xl">
      <div className="flex h-12 items-center rounded-[14px] border border-line bg-card shadow-[0_2px_8px_rgba(15,23,42,.04)] focus-within:border-gold-deep focus-within:ring-[3px] focus-within:ring-gold-deep/25 md:h-[52px]">
        <label htmlFor="home-busca" className="sr-only">
          Pesquise profissionais
        </label>
        <SearchIcon />
        <input
          id="home-busca"
          name="servico"
          placeholder="Pesquise profissionais…"
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-text outline-none placeholder:text-text-soft"
        />
        <input type="hidden" name="ordenar" value="relevancia" />
        <button
          type="submit"
          className="mr-[5px] inline-flex h-9 shrink-0 items-center rounded-[10px] bg-gold px-3.5 text-sm font-semibold text-ink hover:bg-gold-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:h-10 md:px-[18px]"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-4 h-[18px] w-[18px] shrink-0 text-text-soft" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
