import Link from "next/link";
import type { ReactNode } from "react";
import { HomeProviderSearch } from "@/components/home/home-provider-search";
import { OrcahLogo } from "@/components/orcah-logo";
import { appUrl } from "@/lib/urls";

const trades = [
  "Pedreiro",
  "Eletricista",
  "Pintor",
  "Marceneiro",
  "Serralheiro",
  "Mecânico",
  "Encanador",
  "Fotógrafo",
  "Gesseiro",
  "Montador de móveis",
  "Técnico",
];

export default function HeroTestePage() {
  return (
    <div className="min-h-screen bg-paper text-text">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-card/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 lg:px-6">
          <Link href="/" aria-label="Orçah" className="flex h-10 shrink-0 items-center">
            <OrcahLogo priority />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="ml-7 hidden items-center gap-0.5 rounded-full border border-line/75 bg-paper/70 p-1 shadow-[0_10px_34px_-26px_rgba(15,23,42,.55)] backdrop-blur-xl lg:flex"
          >
            <HeaderNavItem href="#como-funciona">Como funciona</HeaderNavItem>
            <HeaderNavItem href="#sua-pagina">Sua página</HeaderNavItem>
            <HeaderNavItem href="#orcamentos">Orçamentos</HeaderNavItem>
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

        <section id="sua-pagina" className="scroll-mt-24 border-y border-line bg-card px-4 py-7 lg:px-6">
          <div className="mx-auto grid w-full max-w-6xl gap-3 sm:grid-cols-3">
            <ResultItem title="1 link para divulgar" text="Bio, status, grupos e redes sociais." />
            <ResultItem title="Sua marca com cara profissional" text="Logo, fotos, serviços e identidade." />
            <ResultItem title="Orçamento sem enrolação" text="Monte, envie e acompanhe a resposta." />
          </div>
        </section>

        <section id="orcamentos" className="scroll-mt-24 bg-paper px-4 py-10 lg:px-6 lg:py-14">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-deep">Feito para prestadores</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">Do primeiro contato ao serviço fechado.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-text-soft">
                O cliente abre sua página, conhece seu trabalho e recebe um orçamento profissional sem você perder tempo.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {trades.map((trade) => (
                <span key={trade} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-text shadow-card">
                  {trade}
                </span>
              ))}
              <span className="rounded-full border border-line px-4 py-2 text-sm text-text-soft">+80 profissões</span>
            </div>
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
      className="relative rounded-full px-3 py-2 text-[13px] font-medium text-text-soft transition duration-200 hover:bg-card hover:text-ink hover:shadow-[0_4px_14px_-10px_rgba(15,23,42,.7)]"
    >
      {children}
    </a>
  );
}

function ResultItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-line/80 bg-paper/50 p-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ok-wash text-ok">✓</span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-5 text-text-soft">{text}</p>
      </div>
    </div>
  );
}
