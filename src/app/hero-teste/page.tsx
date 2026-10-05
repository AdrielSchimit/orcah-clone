import Image from "next/image";
import Link from "next/link";
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

const benefits = [
  ["Seu site", "Logo, fotos e serviços em uma página profissional."],
  ["Divulgue onde quiser", "Instagram, WhatsApp, Facebook e link da bio."],
  ["Orçamento em minutos", "Bonito, profissional e pronto para enviar."],
] as const;

export default function HeroTestePage() {
  return (
    <div className="min-h-screen bg-paper text-text">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 lg:px-6">
          <Link href="/" aria-label="Orçah" className="flex h-10 items-center">
            <OrcahLogo priority />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href={appUrl("/login")} className="hidden min-h-10 items-center px-3 text-sm font-semibold text-text sm:inline-flex">
              Já tenho conta
            </Link>
            <Link
              href={appUrl("/cadastro")}
              className="inline-flex min-h-10 items-center rounded-btn bg-gold px-4 text-sm font-semibold text-ink transition hover:bg-gold-press"
            >
              Criar página grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden px-4 pb-12 pt-8 sm:pt-12 lg:px-6 lg:pb-20 lg:pt-16">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-14">
            <div className="max-w-[38rem]">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold-wash px-3 py-1.5 text-xs font-semibold text-gold-deep">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Para quem vive de serviço
              </div>

              <h1 className="mt-5 text-[2.2rem] font-semibold leading-[1.03] tracking-[-0.035em] text-ink sm:text-5xl lg:text-[3.35rem]">
                Sua página profissional.
                <span className="mt-1 block">Seus orçamentos em minutos.</span>
              </h1>

              <p className="mt-5 max-w-[36rem] text-base leading-7 text-text-soft sm:text-lg">
                Mostre seu trabalho com um link para Instagram, WhatsApp ou Facebook e crie orçamentos bonitos com sua logo.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Onde usar sua página Orçah">
                <span className="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-text-soft">Seu link no</span>
                <SocialChip icon={<InstagramIcon />} label="Instagram" />
                <SocialChip icon={<WhatsAppIcon />} label="WhatsApp" />
                <SocialChip icon={<FacebookIcon />} label="Facebook" />
                <SocialChip icon={<LinkIcon />} label="Onde quiser" />
              </div>

              <div className="mt-7 grid gap-2.5 sm:grid-cols-3">
                {benefits.map(([title, text], index) => (
                  <div key={title} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-ink-text">
                      {index + 1}
                    </span>
                    <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-text-soft">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={appUrl("/cadastro")}
                  className="inline-flex min-h-13 flex-1 items-center justify-center rounded-[14px] bg-gold px-5 text-base font-semibold text-ink shadow-card transition hover:bg-gold-press sm:flex-none"
                >
                  Criar minha página grátis
                </Link>
                <a
                  href={companyPublicUrl(DEMO_SLUG)}
                  className="inline-flex min-h-13 items-center justify-center rounded-[14px] border border-line bg-card px-5 text-base font-semibold text-ink transition hover:border-ink/20"
                >
                  Ver exemplo pronto
                </a>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-soft">
                <span className="inline-flex items-center gap-1.5"><CheckIcon /> {TRIAL_DAYS} dias grátis</span>
                <span className="inline-flex items-center gap-1.5"><CheckIcon /> Sem cartão</span>
                <span className="inline-flex items-center gap-1.5"><CheckIcon /> Funciona no celular</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[470px] pb-16 pt-4 lg:justify-self-end">
              <div className="absolute -left-2 top-0 z-20 animate-float rounded-2xl border border-line bg-card/95 p-3 shadow-float backdrop-blur sm:-left-7 sm:top-8" style={{ animationDuration: "5.4s" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-soft">Seu site está no ar</p>
                <p className="mt-1 font-mono text-xs font-semibold text-ink sm:text-sm">pintura-norte.orcah.com.br</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-text-soft">
                  <span>Instagram</span><span>•</span><span>WhatsApp</span><span>•</span><span>Facebook</span>
                </div>
              </div>

              <div className="relative ml-auto aspect-[4/5] w-[88%] overflow-hidden rounded-[2rem] shadow-float sm:w-[86%]">
                <Image
                  src="/demo/prestador-celular.webp"
                  alt="Prestador usando o Orçah no celular"
                  fill
                  priority
                  sizes="(min-width: 1024px) 430px, 90vw"
                  className="object-cover object-[30%_center]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink/10 via-transparent to-transparent" />
              </div>

              <div className="absolute -bottom-2 right-0 z-10 origin-bottom-right scale-[0.5] sm:right-1 sm:scale-[0.62] lg:-right-3 lg:scale-[0.68]">
                <HeroQuoteDemo />
              </div>

              <div className="absolute right-1 top-14 z-20 animate-float rounded-2xl bg-card/95 px-3 py-2.5 text-xs shadow-float backdrop-blur sm:right-0 sm:top-20" style={{ animationDelay: "-2s", animationDuration: "6.4s" }}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ok-wash text-ok">✓</span>
                  <span>
                    <span className="block font-semibold text-ink">Cliente aprovou</span>
                    <span className="block text-[11px] text-text-soft">R$ 2.450,00 · agora</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-card px-4 py-8 lg:px-6">
          <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-3">
            <ResultItem title="1 link para divulgar" text="Bio, status, grupos e redes sociais." />
            <ResultItem title="Sua marca com cara profissional" text="Logo, fotos, serviços e identidade." />
            <ResultItem title="Orçamento sem enrolação" text="Monte, envie e acompanhe a resposta." />
          </div>
        </section>

        <section className="bg-paper px-4 py-10 lg:px-6 lg:py-14">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-deep">Feito para prestadores</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">Do primeiro cliente ao serviço fechado.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-text-soft">
                O cliente abre sua página, conhece seu trabalho e você manda um orçamento profissional sem perder tempo.
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

function SocialChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-card">
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

function CheckIcon() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ok-wash text-ok" aria-hidden>
      <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
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
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M19.1 4.9A9.8 9.8 0 0 0 12.1 2C6.6 2 2.2 6.4 2.2 11.9c0 1.7.4 3.4 1.3 4.9L2 22l5.3-1.4A9.9 9.9 0 0 0 12 21.8c5.5 0 9.9-4.4 9.9-9.9 0-2.6-1-5.1-2.8-7Zm-7 15.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.8Zm4.5-6.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.1.3-.6.8-.8 1-.1.2-.3.2-.5.1-2.2-1.1-3.6-2-5-4.5-.1-.2 0-.4.1-.5l.4-.4.2-.4c.1-.2 0-.3 0-.4L8 6.3c-.2-.5-.4-.4-.6-.4H7c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.2 3.7.6.3 1.1.4 1.4.5.6.2 1.1.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3Z" />
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