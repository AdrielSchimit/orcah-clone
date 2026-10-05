import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { HomeProviderSearch } from "@/components/home/home-provider-search";
import { HeroQuoteDemo } from "@/components/home/hero-quote-demo";
import { OrcahLogo } from "@/components/orcah-logo";
import { TRIAL_DAYS } from "@/lib/plan-constants";
import { appUrl, companyPublicUrl } from "@/lib/urls";

const DEMO_SLUG = "pintura-norte";

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

const quickBenefits = [
  ["Página profissional", "Logo, fotos e serviços", <PageIcon key="page" />],
  ["Seu link onde quiser", "Instagram, WhatsApp e mais", <LinkIcon key="link" />],
  ["Orçamento em minutos", "Bonito e pronto para enviar", <QuoteIcon key="quote" />],
] as const;

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
        <section id="como-funciona" className="relative isolate scroll-mt-24 overflow-hidden px-4 pb-10 pt-7 sm:pt-12 lg:px-6 lg:pb-20 lg:pt-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_82%_18%,rgba(255,176,32,0.16),transparent_30%),radial-gradient(circle_at_10%_0%,rgba(21,31,56,0.07),transparent_28%)]" />

          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-14">
            <div className="max-w-[39rem]">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold-wash px-3 py-1.5 text-xs font-semibold text-gold-deep shadow-[0_8px_30px_-18px_rgba(255,176,32,.8)]">
                <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_0_4px_rgba(255,176,32,.14)]" />
                Feito para quem vive de serviço
              </div>

              <h1 className="mt-5 text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-5xl lg:text-[3.55rem]">
                Sua página profissional.
                <span className="mt-1 block text-gold-deep">Orçamentos em minutos.</span>
              </h1>

              <p className="mt-4 max-w-[36rem] text-[1.02rem] leading-7 text-text-soft sm:text-lg">
                Um link com sua logo, fotos e serviços para divulgar onde quiser — e orçamento profissional pronto para enviar.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Onde divulgar sua página Orçah">
                <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-soft">Divulgue no</span>
                <SocialChip icon={<InstagramIcon />} label="Instagram" />
                <SocialChip icon={<WhatsAppIcon />} label="WhatsApp" />
                <SocialChip icon={<FacebookIcon />} label="Facebook" />
                <SocialChip icon={<LinkIcon />} label="e onde quiser" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-medium text-text-soft">Para prestadores</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-wash px-2.5 py-1 text-xs font-semibold text-gold-deep">
                  <CalendarIcon />
                  {TRIAL_DAYS} dias grátis
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink shadow-card">
                  <CardIcon />
                  Sem cartão de crédito
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={appUrl("/painel")}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[14px] bg-gold px-5 text-base font-semibold text-ink shadow-[0_12px_30px_-16px_rgba(229,153,26,.85)] transition hover:-translate-y-0.5 hover:bg-gold-press sm:flex-none"
                >
                  Acessar meu painel
                  <ArrowIcon />
                </Link>
                <a
                  href={companyPublicUrl(DEMO_SLUG)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-line bg-card/90 px-5 text-base font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:border-ink/20"
                >
                  <EyeIcon />
                  Ver exemplo pronto
                </a>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
                {quickBenefits.map(([title, text, icon]) => (
                  <div key={title} className="group rounded-2xl border border-line/90 bg-card/75 p-3 shadow-card backdrop-blur sm:p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-ink-text shadow-card transition group-hover:-translate-y-0.5">
                      {icon}
                    </span>
                    <p className="mt-2.5 text-[12px] font-semibold leading-4 text-ink sm:text-sm">{title}</p>
                    <p className="mt-1 hidden text-xs leading-5 text-text-soft sm:block">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

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

        <section className="border-t border-line bg-paper-alt px-4 py-10 lg:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-soft">Também procura alguém?</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">Encontre profissionais no Orçah.</h2>
              </div>
              <Link href="/" className="text-sm font-semibold text-text-soft hover:text-ink">Voltar para a página atual →</Link>
            </div>
            <HomeProviderSearch />
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

function HeroVisual() {
  return (
    <div className="relative mx-auto mt-1 w-full max-w-[500px] pb-12 pt-3 lg:mt-0 lg:justify-self-end lg:pb-16">
      <div className="absolute -inset-x-3 bottom-5 top-10 -z-10 rounded-[2.5rem] bg-gradient-to-br from-gold-wash via-card to-paper-alt opacity-90 blur-[1px]" />

      <div className="absolute left-0 top-0 z-20 animate-float rounded-2xl border border-line bg-card/95 px-3 py-2.5 shadow-float backdrop-blur sm:-left-5 sm:top-7" style={{ animationDuration: "5.6s" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-wash text-gold-deep">
            <LinkIcon />
          </span>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.09em] text-text-soft">Seu site está no ar</p>
            <p className="mt-0.5 font-mono text-[11px] font-semibold text-ink sm:text-xs">pintura-norte.orcah.com.br</p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto aspect-[1.08/1] w-[94%] overflow-hidden rounded-[2rem] border border-white/70 bg-card shadow-float sm:aspect-[4/5] sm:w-[86%]">
        <Image
          src="/demo/prestador-celular.webp"
          alt="Prestador usando o Orçah no celular"
          fill
          priority
          sizes="(min-width: 1024px) 430px, 94vw"
          className="object-cover object-[30%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-white/5" />

        <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-white/60 bg-card/90 p-3 shadow-card backdrop-blur-md sm:hidden">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-ink-text"><PageIcon /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink">Pintura Norte</p>
              <p className="truncate text-[10px] text-text-soft">Logo · trabalhos · serviços · contato</p>
            </div>
            <span className="ml-auto rounded-full bg-ok-wash px-2 py-1 text-[9px] font-semibold text-ok">Online</span>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-1 right-0 z-10 origin-bottom-right scale-[0.43] sm:right-1 sm:scale-[0.62] lg:-right-4 lg:scale-[0.68]">
        <HeroQuoteDemo />
      </div>

      <div className="absolute right-0 top-16 z-20 animate-float rounded-2xl border border-ok/10 bg-card/95 px-3 py-2.5 shadow-float backdrop-blur sm:-right-2 sm:top-20" style={{ animationDelay: "-2.1s", animationDuration: "6.5s" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ok-wash text-ok">✓</span>
          <span>
            <span className="block text-[11px] font-semibold text-ink sm:text-xs">Cliente aprovou</span>
            <span className="block text-[10px] text-text-soft">R$ 2.450,00 · agora</span>
          </span>
        </div>
      </div>

      <div className="absolute bottom-5 left-0 z-20 hidden animate-float rounded-2xl border border-line bg-ink px-3 py-2.5 text-ink-text shadow-float sm:block" style={{ animationDelay: "-3s", animationDuration: "7s" }}>
        <p className="text-[9px] uppercase tracking-[0.09em] text-ink-soft">Orçamento</p>
        <p className="mt-0.5 text-xs font-semibold">Pronto para WhatsApp ✓</p>
      </div>
    </div>
  );
}

function SocialChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/85 px-3 py-1.5 text-[11px] font-semibold text-ink shadow-card backdrop-blur sm:text-xs">
      {icon}
      {label}
    </span>
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
      <path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" strokeLinecap="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="2" y="4" width="12" height="8" rx="1.5" />
      <path d="M2 7h12M4.5 10h3" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2.8 12s3.3-5.2 9.2-5.2S21.2 12 21.2 12 17.9 17.2 12 17.2 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M20 12a8 8 0 0 1-11.7 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.4 8.9c.2-.4.4-.4.6-.4h.5c.2 0 .4.1.5.4l.5 1.4c.1.2.1.4 0 .6l-.4.6c-.1.1-.1.3 0 .4.4.7 1 1.3 1.7 1.7.1.1.3.1.4 0l.6-.4c.2-.1.4-.1.6 0l1.4.5c.3.1.4.3.4.5v.5c0 .2 0 .4-.4.6-.4.2-1 .4-1.7.2-1-.2-2.2-.8-3.4-2-1.2-1.2-1.8-2.4-2-3.4-.1-.7 0-1.3.2-1.7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V4a24 24 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.5v3h2.8v8h3.2Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M10.3 13.7a4 4 0 0 0 5.7 0l2.7-2.7A4 4 0 0 0 13 5.3l-1.5 1.5" strokeLinecap="round" />
      <path d="M13.7 10.3a4 4 0 0 0-5.7 0L5.3 13A4 4 0 1 0 11 18.7l1.5-1.5" strokeLinecap="round" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M4 8h16M8 12h5M8 16h8" strokeLinecap="round" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 2v-3.2A2 2 0 0 1 4 15V8a2 2 0 0 1 2-2Z" />
      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
    </svg>
  );
}
