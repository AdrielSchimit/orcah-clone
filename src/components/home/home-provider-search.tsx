"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HeroQuoteDemo } from "@/components/home/hero-quote-demo";
import { TRIAL_DAYS } from "@/lib/plan-constants";
import { appUrl, companyPublicUrl } from "@/lib/urls";

type HomeIntent = "provider" | "search";

const STORAGE_KEY = "orcah-home-intent-v3";
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
    <section className="relative overflow-hidden px-3 pb-8 pt-5 sm:px-5 sm:pb-12 sm:pt-8 lg:px-6 lg:pb-16">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-paper" />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50rem] transition-opacity duration-500 ${
          intent === "provider"
            ? "bg-[radial-gradient(circle_at_72%_8%,rgba(255,176,32,.19),transparent_31%),radial-gradient(circle_at_14%_4%,rgba(21,31,56,.055),transparent_28%)]"
            : "bg-[radial-gradient(circle_at_70%_8%,rgba(79,121,255,.10),transparent_30%),radial-gradient(circle_at_14%_0%,rgba(21,31,56,.06),transparent_28%)]"
        }`}
      />

      <div className="mx-auto w-full max-w-7xl">
        <div className="mx-auto mb-5 w-full max-w-[650px] sm:mb-7">
          <div className="grid grid-cols-2 rounded-[18px] border border-line/80 bg-card/85 p-1.5 shadow-[0_18px_55px_-38px_rgba(15,23,42,.55)] backdrop-blur-xl">
            <IntentButton
              active={intent === "provider"}
              onClick={() => chooseIntent("provider")}
              icon={<ProviderIcon />}
              title="Sou profissional"
              subtitle="Quero divulgar e orçar"
            />
            <IntentButton
              active={intent === "search"}
              onClick={() => chooseIntent("search")}
              icon={<SearchIcon compact />}
              title="Preciso de um profissional"
              subtitle="Quero encontrar alguém"
            />
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-[28px] border border-line/80 shadow-[0_28px_90px_-60px_rgba(15,23,42,.42)] transition-colors duration-500 sm:rounded-[34px] ${
            intent === "provider" ? "bg-[#fffaf0]" : "bg-[#f5f8ff]"
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
              intent === "provider"
                ? "bg-[linear-gradient(120deg,rgba(255,255,255,.84),rgba(255,248,231,.42)_50%,rgba(255,190,67,.08))]"
                : "bg-[linear-gradient(120deg,rgba(255,255,255,.88),rgba(245,248,255,.50)_52%,rgba(66,102,190,.06))]"
            }`}
          />

          <div className="relative min-h-[610px] sm:min-h-[650px] lg:min-h-[620px]">
            {intent === "provider" ? (
              <ProviderScene />
            ) : (
              <SearchScene onSubmit={onSubmit} onQuickSearch={searchService} />
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-text-soft sm:text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          O Orçah lembra sua escolha neste navegador.
        </div>
      </div>
    </section>
  );
}

function ProviderScene() {
  return (
    <div className="grid min-h-[610px] items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[.95fr_1.05fr] lg:gap-8 lg:px-12 lg:py-9 xl:px-16">
      <div className="relative z-10 max-w-[610px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-card/80 px-3 py-1.5 text-xs font-semibold text-gold-deep shadow-card backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_0_4px_rgba(255,176,32,.13)]" />
          Para quem vive de serviço
        </div>

        <h1 className="mt-5 text-[2.45rem] font-semibold leading-[.99] tracking-[-0.052em] text-ink sm:text-[3.2rem] lg:text-[3.55rem] xl:text-[4rem]">
          Sua página profissional.
          <span className="mt-1 block text-gold-deep">Orçamentos em minutos.</span>
        </h1>

        <p className="mt-5 max-w-[35rem] text-[1rem] leading-7 text-text-soft sm:text-lg">
          Um link com sua logo, fotos e serviços para divulgar no Instagram, WhatsApp, Facebook ou onde quiser.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <SocialChip icon={<InstagramIcon />} label="Instagram" />
          <SocialChip icon={<WhatsAppIcon />} label="WhatsApp" />
          <SocialChip icon={<FacebookIcon />} label="Facebook" />
          <SocialChip icon={<LinkIcon />} label="Seu link" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-text-soft">Para prestadores</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-wash px-2.5 py-1 font-semibold text-gold-deep">
            <CalendarIcon /> {TRIAL_DAYS} dias grátis
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/90 px-2.5 py-1 font-semibold text-ink shadow-card">
            <CardIcon /> Sem cartão
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={appUrl("/painel")}
            className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-gold px-5 text-base font-semibold text-ink shadow-[0_14px_30px_-18px_rgba(229,153,26,.95)] transition hover:-translate-y-0.5 hover:bg-gold-press"
          >
            Acessar meu painel <ArrowIcon />
          </Link>
          <a
            href={companyPublicUrl(DEMO_SLUG)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-line bg-card/85 px-5 text-base font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:border-ink/20"
          >
            <EyeIcon /> Ver exemplo pronto
          </a>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2.5">
          <MiniBenefit icon={<PageIcon />} title="Sua página" text="Logo, fotos e serviços" />
          <MiniBenefit icon={<LinkIcon />} title="Seu link" text="Divulgue onde quiser" />
          <MiniBenefit icon={<QuoteIcon />} title="Orçamento" text="Rápido e profissional" />
        </div>
      </div>

      <ProviderVisual />
    </div>
  );
}

function SearchScene({
  onSubmit,
  onQuickSearch,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onQuickSearch: (service: string) => void;
}) {
  return (
    <div className="grid min-h-[610px] items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:px-12 lg:py-9 xl:px-16">
      <div className="relative z-10 max-w-[620px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#4169a6]/15 bg-card/80 px-3 py-1.5 text-xs font-semibold text-[#365885] shadow-card backdrop-blur">
          <LocationPinIcon /> Profissionais para o que você precisa
        </div>

        <h1 className="mt-5 text-[2.45rem] font-semibold leading-[.99] tracking-[-0.052em] text-ink sm:text-[3.2rem] lg:text-[3.55rem] xl:text-[4rem]">
          Encontre quem resolve.
          <span className="mt-1 block text-[#4169a6]">Sem perder tempo.</span>
        </h1>

        <p className="mt-5 max-w-[35rem] text-[1rem] leading-7 text-text-soft sm:text-lg">
          Pesquise o serviço, compare trabalhos e fale direto com profissionais da sua região.
        </p>

        <form onSubmit={onSubmit} className="mt-6 rounded-[18px] border border-line bg-card/92 p-2 shadow-[0_18px_48px_-34px_rgba(15,23,42,.48)] backdrop-blur">
          <div className="flex min-h-12 items-center rounded-[13px] bg-paper/70 focus-within:bg-card focus-within:ring-[3px] focus-within:ring-[#4169a6]/15">
            <SearchIcon />
            <input
              name="servico"
              placeholder="Ex.: eletricista, pintor, pedreiro..."
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-text outline-none placeholder:text-text-soft sm:text-base"
            />
            <button
              type="submit"
              className="mr-1.5 inline-flex h-10 shrink-0 items-center rounded-[11px] bg-ink px-4 text-sm font-semibold text-ink-text transition hover:-translate-y-0.5 sm:px-5"
            >
              Buscar <ArrowIcon />
            </button>
          </div>
        </form>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-soft">Mais procurados</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickServices.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => onQuickSearch(service)}
                className="rounded-full border border-line bg-card/78 px-3 py-1.5 text-xs font-semibold text-text shadow-card transition hover:border-[#4169a6]/25 hover:bg-white hover:text-ink"
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2.5">
          <MiniBenefit icon={<SearchIcon compact />} title="Pesquise" text="Pelo serviço que precisa" />
          <MiniBenefit icon={<GalleryIcon />} title="Compare" text="Veja trabalhos reais" />
          <MiniBenefit icon={<WhatsAppIcon />} title="Converse" text="Contato sem enrolação" />
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
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 items-center gap-2 rounded-[13px] px-2.5 py-2.5 text-left transition duration-300 sm:gap-3 sm:px-4 ${
        active
          ? "border border-gold/20 bg-card text-ink shadow-[0_8px_26px_-20px_rgba(15,23,42,.42)]"
          : "border border-transparent text-text-soft hover:bg-paper/70 hover:text-ink"
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition sm:h-9 sm:w-9 ${active ? "bg-gold-wash text-gold-deep" : "bg-paper-alt text-text-soft"}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold leading-4 sm:text-sm">{title}</span>
        <span className="mt-0.5 hidden truncate text-[11px] font-medium text-text-soft sm:block">{subtitle}</span>
      </span>
    </button>
  );
}

function ProviderVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] pb-11 pt-5 lg:justify-self-end">
      <div className="absolute inset-x-5 bottom-3 top-12 -z-0 rounded-[2.7rem] bg-[radial-gradient(circle_at_55%_25%,rgba(255,190,72,.28),transparent_43%),linear-gradient(145deg,rgba(255,255,255,.82),rgba(255,238,197,.72))]" />

      <div className="absolute left-0 top-0 z-20 animate-float rounded-2xl border border-line bg-card/95 px-3 py-2.5 shadow-float backdrop-blur sm:-left-3 sm:top-5" style={{ animationDuration: "5.8s" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-wash text-gold-deep"><LinkIcon /></span>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.09em] text-text-soft">Sua página está no ar</p>
            <p className="mt-0.5 font-mono text-[10px] font-semibold text-ink sm:text-xs">pintura-norte.orcah.com.br</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto aspect-[1.04/1] w-[92%] overflow-hidden rounded-[2rem] border border-white/80 bg-card shadow-float sm:aspect-[4/5] sm:w-[82%]">
        <Image
          src="/demo/prestador-celular.webp"
          alt="Prestador usando o Orçah"
          fill
          priority
          sizes="(min-width: 1024px) 440px, 92vw"
          className="object-cover object-[30%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-white/5" />
      </div>

      <div className="absolute -bottom-2 right-0 z-20 origin-bottom-right scale-[0.43] sm:right-1 sm:scale-[0.62] lg:-right-2 lg:scale-[0.66]">
        <HeroQuoteDemo />
      </div>

      <div className="absolute right-0 top-20 z-20 animate-float rounded-2xl border border-ok/10 bg-card/95 px-3 py-2.5 shadow-float backdrop-blur sm:-right-2 sm:top-24" style={{ animationDelay: "-2s", animationDuration: "6.6s" }}>
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
    <div className="relative mx-auto w-full max-w-[535px] pb-5 pt-3 lg:justify-self-end">
      <div className="absolute inset-x-5 bottom-0 top-8 -z-0 rounded-[2.7rem] bg-[radial-gradient(circle_at_55%_24%,rgba(93,133,210,.15),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.9),rgba(232,239,252,.76))]" />

      <div className="relative z-10 mx-auto w-[94%] overflow-hidden rounded-[26px] border border-line/80 bg-card/94 p-3 shadow-float backdrop-blur sm:w-[88%] sm:p-4">
        <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#4169a6]">Perfil encontrado</p>
            <p className="mt-0.5 text-base font-semibold text-ink sm:text-lg">Pintura Norte</p>
          </div>
          <span className="rounded-full bg-ok-wash px-2.5 py-1 text-[10px] font-semibold text-ok">Disponível</span>
        </div>

        <div className="mt-3 grid grid-cols-[1.1fr_.9fr] gap-2.5">
          <div className="relative min-h-[190px] overflow-hidden rounded-2xl sm:min-h-[250px]">
            <Image src="/demo/trabalho-sala.webp" alt="Trabalho de pintura" fill sizes="260px" className="object-cover" />
          </div>
          <div className="grid gap-2.5">
            <div className="relative min-h-[90px] overflow-hidden rounded-2xl sm:min-h-[120px]">
              <Image src="/demo/trabalho-fachada.webp" alt="Fachada pintada" fill sizes="180px" className="object-cover" />
            </div>
            <div className="relative min-h-[90px] overflow-hidden rounded-2xl sm:min-h-[120px]">
              <Image src="/demo/trabalho-acabamento.webp" alt="Acabamento de pintura" fill sizes="180px" className="object-cover" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-paper/70 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-ink-text">PN</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-ink">Pintura Norte</p>
              <span className="text-[10px] font-semibold text-gold-deep">★ 4,9</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-text-soft">Pintura residencial · acabamento · fachada</p>
          </div>
          <button type="button" className="hidden rounded-xl bg-ink px-3 py-2 text-[11px] font-semibold text-ink-text sm:block">Ver perfil</button>
        </div>
      </div>

      <div className="absolute -left-1 top-16 z-20 animate-float rounded-2xl border border-line bg-card/95 px-3 py-2 shadow-card backdrop-blur sm:-left-3" style={{ animationDuration: "6.4s" }}>
        <p className="text-[9px] uppercase tracking-[0.08em] text-text-soft">Profissionais próximos</p>
        <p className="mt-0.5 text-xs font-semibold text-ink">23 resultados</p>
      </div>

      <div className="absolute -right-1 bottom-8 z-20 animate-float rounded-2xl border border-line bg-card/95 px-3 py-2 shadow-card backdrop-blur sm:-right-4" style={{ animationDelay: "-2.6s", animationDuration: "7.1s" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ok-wash text-ok"><WhatsAppIcon /></span>
          <div>
            <p className="text-[10px] text-text-soft">Contato direto</p>
            <p className="text-xs font-semibold text-ink">Pedir orçamento</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBenefit({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line/85 bg-card/72 p-3 shadow-card backdrop-blur sm:p-3.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-ink-text">{icon}</span>
      <p className="mt-2.5 text-[11px] font-semibold leading-4 text-ink sm:text-sm">{title}</p>
      <p className="mt-1 hidden text-xs leading-5 text-text-soft sm:block">{text}</p>
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

function SearchIcon({ compact = false }: { compact?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={compact ? "h-4 w-4" : "ml-3.5 h-[18px] w-[18px] shrink-0 text-text-soft"} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function ProviderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0M18.5 5.5l1 1 2-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m6 17 4.2-4 2.8 2.4 2.2-2 2.8 3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
