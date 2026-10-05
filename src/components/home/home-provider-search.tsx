"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroQuoteDemo } from "@/components/home/hero-quote-demo";
import { TRIAL_DAYS } from "@/lib/plan-constants";
import { appUrl, companyPublicUrl } from "@/lib/urls";

type HomeIntent = "provider" | "search";

const STORAGE_KEY = "orcah-home-intent-v2";
const DEMO_SLUG = "pintura-norte";
const quickServices = ["Eletricista", "Pintor", "Pedreiro", "Encanador", "Limpeza", "Fotógrafo"];

export function HomeProviderSearch() {
  const router = useRouter();
  const [intent, setIntent] = useState<HomeIntent>("provider");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "provider" || saved === "search") setIntent(saved);
  }, []);

  function chooseIntent(next: HomeIntent) {
    setIntent(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("servico") ?? "").trim();
    window.localStorage.setItem(STORAGE_KEY, "search");

    const params = new URLSearchParams();
    if (text) params.set("servico", text.toLowerCase());
    params.set("ordenar", "relevancia");
    router.push(`/prestadores?${params.toString()}`);
  }

  function searchService(service: string) {
    window.localStorage.setItem(STORAGE_KEY, "search");
    const params = new URLSearchParams({ servico: service.toLowerCase(), ordenar: "relevancia" });
    router.push(`/prestadores?${params.toString()}`);
  }

  return (
    <section className="relative isolate overflow-hidden px-4 pb-10 pt-5 sm:pt-8 lg:px-6 lg:pb-20 lg:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_82%_16%,rgba(255,176,32,0.15),transparent_30%),radial-gradient(circle_at_8%_0%,rgba(21,31,56,0.06),transparent_28%)]" />

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-7 grid grid-cols-2 overflow-hidden rounded-[18px] border border-line/80 bg-card/75 p-1.5 shadow-[0_16px_42px_-34px_rgba(15,23,42,.5)] backdrop-blur-xl sm:mb-9 sm:max-w-[650px]">
          <IntentButton
            active={intent === "provider"}
            onClick={() => chooseIntent("provider")}
            icon={<ProviderIcon />}
            title="Sou profissional"
            subtitle="Divulgar meus serviços"
          />
          <IntentButton
            active={intent === "search"}
            onClick={() => chooseIntent("search")}
            icon={<SearchIcon compact />}
            title="Preciso de um profissional"
            subtitle="Encontrar e pedir orçamento"
          />
        </div>

        {intent === "provider" ? (
          <ProviderHero />
        ) : (
          <SearchHero onSubmit={onSubmit} onQuickSearch={searchService} />
        )}
      </div>
    </section>
  );
}

function ProviderHero() {
  return (
    <div className="grid items-center gap-9 lg:grid-cols-[1.02fr_.98fr] lg:gap-14">
      <div className="max-w-[39rem]">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold-wash px-3 py-1.5 text-xs font-semibold text-gold-deep">
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
            <CalendarIcon /> {TRIAL_DAYS} dias grátis
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink shadow-card">
            <CardIcon /> Sem cartão de crédito
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href={appUrl("/painel")}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[14px] bg-gold px-5 text-base font-semibold text-ink shadow-[0_12px_30px_-16px_rgba(229,153,26,.85)] transition hover:-translate-y-0.5 hover:bg-gold-press sm:flex-none"
          >
            Acessar meu painel <ArrowIcon />
          </Link>
          <a
            href={companyPublicUrl(DEMO_SLUG)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-line bg-card/90 px-5 text-base font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:border-ink/20"
          >
            <EyeIcon /> Ver exemplo pronto
          </a>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
          <MiniBenefit icon={<PageIcon />} title="Página profissional" text="Logo, fotos e serviços" />
          <MiniBenefit icon={<LinkIcon />} title="Seu link onde quiser" text="Instagram, WhatsApp e mais" />
          <MiniBenefit icon={<QuoteIcon />} title="Orçamento em minutos" text="Bonito e pronto para enviar" />
        </div>
      </div>

      <ProviderVisual />
    </div>
  );
}

function SearchHero({
  onSubmit,
  onQuickSearch,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onQuickSearch: (service: string) => void;
}) {
  return (
    <div className="grid items-center gap-9 lg:grid-cols-[1.04fr_.96fr] lg:gap-14">
      <div className="max-w-[40rem]">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold-wash px-3 py-1.5 text-xs font-semibold text-gold-deep">
          <LocationPinIcon /> Profissionais para o que você precisa
        </div>

        <h1 className="mt-5 text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-5xl lg:text-[3.45rem]">
          Encontre o profissional certo.
          <span className="mt-1 block text-gold-deep">Peça um orçamento.</span>
        </h1>

        <p className="mt-4 max-w-[36rem] text-[1.02rem] leading-7 text-text-soft sm:text-lg">
          Pesquise pelo serviço, veja trabalhos e entre em contato com profissionais da sua região.
        </p>

        <form onSubmit={onSubmit} className="mt-6 rounded-[18px] border border-line bg-card p-2 shadow-[0_16px_46px_-34px_rgba(15,23,42,.55)]">
          <div className="flex min-h-12 items-center rounded-[13px] bg-paper/70 focus-within:bg-card focus-within:ring-[3px] focus-within:ring-gold-deep/18">
            <SearchIcon />
            <input
              name="servico"
              placeholder="Ex.: eletricista, pintor, pedreiro..."
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-text outline-none placeholder:text-text-soft sm:text-base"
            />
            <button
              type="submit"
              className="mr-1.5 inline-flex h-10 shrink-0 items-center rounded-[11px] bg-gold px-4 text-sm font-semibold text-ink transition hover:bg-gold-press sm:px-5"
            >
              Buscar <span className="ml-1.5 hidden sm:inline">profissionais</span>
              <ArrowIcon />
            </button>
          </div>
        </form>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-soft">Buscas rápidas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickServices.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => onQuickSearch(service)}
                className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-text shadow-card transition hover:border-gold/35 hover:bg-gold-wash hover:text-gold-deep"
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <MiniBenefit icon={<SearchIcon compact />} title="Encontre rápido" text="Pesquise pelo serviço" />
          <MiniBenefit icon={<PageIcon />} title="Veja trabalhos" text="Fotos e informações" />
          <MiniBenefit icon={<WhatsAppIcon />} title="Fale direto" text="Contato sem enrolação" />
        </div>
      </div>

      <SearchVisual />
    </div>
  );
}

function IntentButton({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left transition sm:px-4 ${
        active
          ? "border border-gold/25 bg-gold-wash text-ink shadow-[0_8px_22px_-18px_rgba(229,153,26,.9)]"
          : "border border-transparent text-text-soft hover:bg-paper/70 hover:text-ink"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? "bg-card text-gold-deep" : "bg-paper-alt text-text-soft"}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold sm:text-sm">{title}</span>
        <span className="mt-0.5 hidden truncate text-[11px] font-medium text-text-soft sm:block">{subtitle}</span>
      </span>
    </button>
  );
}

function ProviderVisual() {
  return (
    <div className="relative mx-auto mt-1 w-full max-w-[500px] pb-12 pt-3 lg:mt-0 lg:justify-self-end lg:pb-16">
      <div className="absolute -inset-x-3 bottom-5 top-10 -z-10 rounded-[2.5rem] bg-gradient-to-br from-gold-wash via-card to-paper-alt opacity-90" />

      <div className="absolute left-0 top-0 z-20 animate-float rounded-2xl border border-line bg-card/95 px-3 py-2.5 shadow-float backdrop-blur sm:-left-5 sm:top-7" style={{ animationDuration: "5.6s" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-wash text-gold-deep"><LinkIcon /></span>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.09em] text-text-soft">Seu site está no ar</p>
            <p className="mt-0.5 font-mono text-[11px] font-semibold text-ink sm:text-xs">pintura-norte.orcah.com.br</p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto aspect-[1.08/1] w-[94%] overflow-hidden rounded-[2rem] border border-white/70 bg-card shadow-float sm:aspect-[4/5] sm:w-[86%]">
        <Image src="/demo/prestador-celular.webp" alt="Prestador usando o Orçah no celular" fill priority sizes="(min-width: 1024px) 430px, 94vw" className="object-cover object-[30%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-white/5" />
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
    </div>
  );
}

function SearchVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px] lg:justify-self-end">
      <div className="absolute -inset-3 -z-10 rounded-[2.5rem] bg-gradient-to-br from-gold-wash via-card to-paper-alt" />
      <div className="rounded-[26px] border border-line/80 bg-card/92 p-3 shadow-float backdrop-blur sm:p-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-paper/70 p-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-soft">Resultado em destaque</p>
            <p className="mt-1 text-base font-semibold text-ink">Pintura Norte</p>
            <p className="mt-0.5 text-xs text-text-soft">Pintura residencial · atendimento local</p>
          </div>
          <span className="rounded-full bg-ok-wash px-2.5 py-1 text-xs font-semibold text-ok">5.0 ★</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <WorkThumb src="/demo/trabalho-sala.webp" alt="Trabalho de pintura em sala" />
          <WorkThumb src="/demo/trabalho-fachada.webp" alt="Trabalho de pintura em fachada" />
          <WorkThumb src="/demo/trabalho-acabamento.webp" alt="Trabalho de acabamento" />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <InfoCard icon={<CheckShieldIcon />} title="Perfil completo" text="Serviços, fotos e contato" />
          <InfoCard icon={<WhatsAppIcon />} title="Peça orçamento" text="Fale direto com o profissional" />
        </div>

        <a
          href={companyPublicUrl(DEMO_SLUG)}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[13px] bg-ink px-4 text-sm font-semibold text-ink-text transition hover:-translate-y-0.5"
        >
          Ver perfil de exemplo <ArrowIcon />
        </a>
      </div>
    </div>
  );
}

function WorkThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[1.15/1] overflow-hidden rounded-xl bg-paper-alt">
      <Image src={src} alt={alt} fill sizes="160px" className="object-cover" />
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line/80 bg-card p-3 shadow-card">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-wash text-gold-deep">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-text-soft">{text}</p>
      </div>
    </div>
  );
}

function MiniBenefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line/90 bg-card/80 p-3 shadow-card backdrop-blur sm:p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-ink-text">{icon}</span>
      <p className="mt-2.5 text-[12px] font-semibold leading-4 text-ink sm:text-sm">{title}</p>
      <p className="mt-1 hidden text-xs leading-5 text-text-soft sm:block">{text}</p>
    </div>
  );
}

function SocialChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/85 px-3 py-1.5 text-[11px] font-semibold text-ink shadow-card sm:text-xs">{icon}{label}</span>;
}

function SearchIcon({ compact = false }: { compact?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={compact ? "h-4 w-4" : "ml-4 h-[18px] w-[18px] shrink-0 text-text-soft"} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function ProviderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="3" /><path d="M6.5 19c.5-3.4 2.3-5.2 5.5-5.2s5 1.8 5.5 5.2" strokeLinecap="round" />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function CheckShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l7 3v5c0 4.7-2.7 8-7 10-4.3-2-7-5.3-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><rect x="2.5" y="3.5" width="11" height="10" rx="2" /><path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" strokeLinecap="round" /></svg>;
}

function CardIcon() {
  return <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><rect x="2" y="4" width="12" height="8" rx="1.5" /><path d="M2 7h12M4.5 10h3" strokeLinecap="round" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden><path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function EyeIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M2.8 12s3.3-5.2 9.2-5.2S21.2 12 21.2 12 17.9 17.2 12 17.2 2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="2.4" /></svg>;
}

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M20 12a8 8 0 0 1-11.7 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.4 8.9c.2-.4.4-.4.6-.4h.5c.2 0 .4.1.5.4l.5 1.4c.1.2.1.4 0 .6l-.4.6c-.1.1-.1.3 0 .4.4.7 1 1.3 1.7 1.7.1.1.3.1.4 0l.6-.4c.2-.1.4-.1.6 0l1.4.5c.3.1.4.3.4.5v.5c0 .2 0 .4-.4.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V4a24 24 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.5v3h2.8v8h3.2Z" /></svg>;
}

function LinkIcon() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M10.3 13.7a4 4 0 0 0 5.7 0l2.7-2.7A4 4 0 0 0 13 5.3l-1.5 1.5" strokeLinecap="round" /><path d="M13.7 10.3a4 4 0 0 0-5.7 0L5.3 13A4 4 0 1 0 11 18.7l1.5-1.5" strokeLinecap="round" /></svg>;
}

function PageIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 8h16M8 12h5M8 16h8" strokeLinecap="round" /></svg>;
}

function QuoteIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M6 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 2v-3.2A2 2 0 0 1 4 15V8a2 2 0 0 1 2-2Z" /><path d="M8 10h8M8 14h5" strokeLinecap="round" /></svg>;
}
