import Link from "next/link";
import type { ReactNode } from "react";
import { HomeProviderSearch } from "@/components/home/home-provider-search";
import { OrcahLogo } from "@/components/orcah-logo";
import { appUrl } from "@/lib/urls";

export default function HeroTestePage() {
  return (
    <div className="min-h-screen bg-paper text-text">
      <header className="sticky top-0 z-40 border-b border-line/65 bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 lg:px-6">
          <Link href="/" aria-label="Orçah" className="flex h-10 shrink-0 items-center">
            <OrcahLogo priority />
          </Link>

          <nav aria-label="Navegação principal" className="ml-8 hidden items-center gap-1 lg:flex">
            <HeaderNavItem href="#como-funciona">Como funciona</HeaderNavItem>
            <HeaderNavItem href="/#plano">Plano</HeaderNavItem>
            <HeaderNavItem href="/#perguntas">Perguntas</HeaderNavItem>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={appUrl("/login")}
              className="hidden min-h-10 items-center rounded-full px-3.5 text-sm font-semibold text-text transition hover:bg-paper-alt hover:text-ink sm:inline-flex"
            >
              Já tenho conta
            </Link>
            <Link
              href={appUrl("/cadastro")}
              className="inline-flex min-h-10 items-center rounded-full bg-gold px-4.5 text-sm font-semibold text-ink shadow-[0_10px_24px_-16px_rgba(229,153,26,.85)] transition hover:-translate-y-0.5 hover:bg-gold-press"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div id="como-funciona" className="scroll-mt-24">
          <HomeProviderSearch />
        </div>

        <section className="border-y border-line/75 bg-card px-4 py-6 lg:px-6">
          <div className="mx-auto grid w-full max-w-7xl gap-3 sm:grid-cols-3">
            <ResultItem title="Para profissionais" text="Página, marca e orçamento em um só lugar." />
            <ResultItem title="Para quem precisa contratar" text="Pesquisa simples, trabalhos visíveis e contato direto." />
            <ResultItem title="Um ecossistema só" text="Mais procura para quem presta. Mais facilidade para quem busca." />
          </div>
        </section>
      </main>
    </div>
  );
}

function HeaderNavItem({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-full px-3 py-2 text-[13px] font-medium text-text-soft transition duration-200 hover:bg-paper-alt hover:text-ink"
    >
      {children}
    </a>
  );
}

function ResultItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-line/75 bg-paper/55 p-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-wash text-xs font-bold text-gold-deep">✓</span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-5 text-text-soft">{text}</p>
      </div>
    </div>
  );
}
