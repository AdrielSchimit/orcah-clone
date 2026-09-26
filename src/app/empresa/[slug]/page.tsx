import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { CompanyGallery } from "@/components/company-gallery";
import { OrcahLogo } from "@/components/orcah-logo";
import { PageViewTracker, TrackedLink } from "@/components/page-tracking";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { facebookUrl, instagramUrl, websiteUrl } from "@/lib/company-display";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { getPublicCompanyPage, readableTextColor } from "@/lib/public-page";
import { appUrl } from "@/lib/urls";
import { whatsappHref } from "@/lib/whatsapp";

const loadPage = cache((slug: string) => getPublicCompanyPage(prisma, slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await loadPage((await params).slug);
  if (!page) return { title: { absolute: "Página não encontrada | Orçah" } };
  const title = `${page.name} | Orçah`;
  const description =
    page.description?.slice(0, 160) || `${page.ramo} em ${page.areaLabel}. Peça seu orçamento pelo celular.`;
  const image = page.logoPath && /^https?:\/\//.test(page.logoPath) ? [{ url: page.logoPath }] : undefined;
  return {
    // absoluto: o layout raiz acrescentaria "· Orçah" de novo
    title: { absolute: title },
    description,
    openGraph: { title, description, type: "website", locale: "pt_BR", images: image },
    twitter: { card: "summary", title, description },
  };
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.87 9.87 0 0 0 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.25 8.23z" />
    </svg>
  );
}

export default async function EmpresaPublicaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ servico?: string }>;
}) {
  const page = await loadPage((await params).slug);
  if (!page) notFound();
  const chosenService = String((await searchParams).servico ?? "").slice(0, 160);

  const zap = page.whatsapp
    ? whatsappHref(page.whatsapp, `Olá, ${page.name}! Vi sua página no Orçah e gostaria de um orçamento.`)
    : "";
  const insta = instagramUrl(page.instagram);
  const face = facebookUrl(page.facebook);
  const site = websiteUrl(page.website);
  const heroBg = page.primaryColor ?? "#0b1120";
  const heroText = readableTextColor(heroBg);
  const accent = page.secondaryColor ?? "#ffb020";
  const accentText = readableTextColor(accent);
  const categories = [...new Set(page.services.map((service) => service.category).filter(Boolean))];

  return (
    <div className="min-h-full w-full flex-1 bg-paper text-text">
      <PageViewTracker slug={page.slug} />

      <header style={{ backgroundColor: heroBg, color: heroText }} className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: accent }}
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-12 sm:pt-16">
          {page.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.logoPath}
              alt={page.name}
              className="gold-edge h-20 w-20 rounded-2xl border bg-white object-cover sm:h-24 sm:w-24"
            />
          ) : (
            <span
              className="gold-edge flex h-20 w-20 items-center justify-center rounded-2xl border text-3xl font-semibold sm:h-24 sm:w-24"
              style={{ backgroundColor: accent, color: accentText }}
            >
              {page.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">{page.name}</h1>
          <p className="mt-2 text-sm font-medium opacity-80">
            {page.ramo} · {page.areaLabel}
          </p>
          {page.description ? (
            <p className="mt-4 max-w-xl text-base leading-relaxed opacity-90">{page.description}</p>
          ) : null}
          <div className="mt-7 grid gap-3 sm:flex">
            <TrackedLink
              slug={page.slug}
              event="quote"
              href="#pedir"
              className="gold-glow flex min-h-12 items-center justify-center rounded-btn bg-gold px-6 text-base font-semibold text-ink hover:bg-gold-press"
            >
              Pedir orçamento
            </TrackedLink>
            {zap ? (
              <TrackedLink
                slug={page.slug}
                event="whatsapp"
                href={zap}
                external
                className="flex min-h-12 items-center justify-center gap-2 rounded-btn bg-zap px-6 text-base font-semibold text-ink"
              >
                <ZapIcon />
                WhatsApp
              </TrackedLink>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        {page.services.length > 0 ? (
          <section className="pt-10" aria-labelledby="servicos">
            <h2 id="servicos" className="text-xl font-semibold">
              Serviços
            </h2>
            {categories.length > 1 ? (
              <p className="mt-1 text-sm text-text-soft">{categories.join(" · ")}</p>
            ) : null}
            <ul className="mt-4 grid items-start gap-3 sm:grid-cols-2">
              {page.services.map((service) => (
                <li
                  key={service.name}
                  className={`flex flex-col overflow-hidden rounded-box border bg-card ${service.featured ? "gold-edge" : "border-line"}`}
                >
                  {service.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.imagePath} alt={service.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  ) : null}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold leading-snug">{service.name}</h3>
                      {service.featured ? (
                        <span className="shrink-0 rounded-full bg-gold-wash px-2 py-0.5 text-[11px] font-semibold text-gold-deep">
                          Destaque
                        </span>
                      ) : null}
                    </div>
                    {service.category ? <p className="mt-0.5 text-xs text-text-soft">{service.category}</p> : null}
                    {service.description ? (
                      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-text-soft">{service.description}</p>
                    ) : null}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      {service.price !== null ? (
                        <p className="text-sm">
                          <span className="font-semibold">{formatBRL(service.price)}</span>
                          <span className="text-text-soft"> / {service.unit}</span>
                        </p>
                      ) : (
                        <span />
                      )}
                      <TrackedLink
                        slug={page.slug}
                        event="quote"
                        href={`?servico=${encodeURIComponent(service.name)}#pedir`}
                        className="flex min-h-11 items-center rounded-btn border border-line px-4 text-sm font-semibold hover:border-gold"
                      >
                        Pedir orçamento
                      </TrackedLink>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {page.photos.length > 0 ? (
          <section className="pt-10" aria-labelledby="trabalhos">
            <h2 id="trabalhos" className="mb-4 text-xl font-semibold">
              Trabalhos
            </h2>
            <CompanyGallery photos={page.photos} />
          </section>
        ) : null}

        <section className="pt-10" aria-labelledby="contato">
          <h2 id="contato" className="text-xl font-semibold">
            Contato
          </h2>
          <div className="mt-4 rounded-box border border-line bg-card p-4">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Atende em</dt>
                <dd className="mt-0.5 font-medium">{page.areaLabel}</dd>
              </div>
              {page.openingHours ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Horário</dt>
                  <dd className="mt-0.5 font-medium">{page.openingHours}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {zap ? (
                <TrackedLink
                  slug={page.slug}
                  event="whatsapp"
                  href={zap}
                  external
                  className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-btn bg-zap px-4 font-semibold text-ink"
                >
                  <ZapIcon />
                  Chamar no WhatsApp
                </TrackedLink>
              ) : null}
              {insta ? (
                <a href={insta} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-btn border border-line px-3 text-center text-sm font-medium">
                  Instagram
                </a>
              ) : null}
              {face ? (
                <a href={face} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-btn border border-line px-3 text-center text-sm font-medium">
                  Facebook
                </a>
              ) : null}
              {site ? (
                <a href={site} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-btn border border-line px-3 text-center text-sm font-medium">
                  Site
                </a>
              ) : null}
              {page.phone ? (
                <a href={`tel:${page.phone}`} className="flex min-h-12 items-center justify-center rounded-btn border border-line px-3 text-center text-sm font-medium">
                  Ligar
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="scroll-mt-4 pt-10">
          <QuoteRequestForm
            key={chosenService}
            slug={page.slug}
            defaultService={chosenService}
            services={page.services.map((service) => service.name)}
          />
        </section>

        <a href={appUrl("/")} className="mt-12 flex flex-col items-center gap-2 text-center text-xs text-text-soft">
          <OrcahLogo className="h-6 w-auto" />
          Página feita com Orçah
        </a>
      </main>
    </div>
  );
}
