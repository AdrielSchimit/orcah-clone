import { CompanyGallery } from "@/components/company-gallery";
import { OrcahLogo } from "@/components/orcah-logo";
import { PageViewTracker, TrackedLink } from "@/components/page-tracking";
import { ProviderQuoteExperience, QuoteRequestButton } from "@/components/provider-quote-experience";
import { ServiceCoverPlaceholder } from "@/components/service-cover-placeholder";
import { facebookUrl, instagramUrl, websiteUrl } from "@/lib/company-display";
import { formatBRL } from "@/lib/money";
import { readableTextColor, type PublicCompanyPage } from "@/lib/public-page";
import { appUrl } from "@/lib/urls";
import { whatsappHref } from "@/lib/whatsapp";
import { resolveServiceCoverTheme } from "@/lib/service-cover-themes";

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.87 9.87 0 0 0 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.25 8.23z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ProviderShowcase({page, chosenService = "", buttonStyles}: {
  page: PublicCompanyPage;
  chosenService?: string;
  buttonStyles: { gold: string; secondary: string };
}) {
  const zap = page.whatsapp
    ? whatsappHref(page.whatsapp, `Olá, ${page.name}! Vi sua página no Orçah e gostaria de um orçamento.`)
    : "";
  const insta = instagramUrl(page.instagram);
  const face = facebookUrl(page.facebook);
  const site = websiteUrl(page.website);
  const heroBg = page.coverPath
    ? page.primaryColor ?? "#151f38"
    : resolveServiceCoverTheme(page.coverCategory).background;
  const heroText = page.coverPath ? "#ffffff" : readableTextColor(heroBg);
  const accent = "#ffb020";
  const accentText = readableTextColor(accent);
  const categories = [...new Set(page.services.map((service) => service.category).filter(Boolean))];

  return (
    <div className="public-company-page min-h-full w-full flex-1 bg-paper text-text">
      <PageViewTracker slug={page.slug} />
      <ProviderQuoteExperience slug={page.slug} services={page.services.map(service => service.name)} initialService={chosenService} whatsappUrl={zap} primaryClassName={buttonStyles.gold}>

      <header style={{ backgroundColor: heroBg, color: heroText }} id="provider-hero" className="provider-hero relative overflow-hidden">
        {page.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.coverPath} alt="" className="provider-cover" />
         ) : <div className="provider-cover"><ServiceCoverPlaceholder category={page.coverCategory} /></div>}
        {page.coverPath ? <div className="provider-cover-shade" aria-hidden /> : null}
        <div className="provider-profile">
          <div className="provider-avatar">
          {page.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.logoPath}
              alt={page.name}
              className="provider-logo"
            />
          ) : (
            <span
              className="provider-logo provider-logo-fallback"
              style={{ backgroundColor: accent, color: accentText }}
            >
              {page.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          </div>
          <div className="provider-profile-copy">
          <p className="provider-eyebrow">{page.ramo}</p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">{page.name}</h1>
          <p className="mt-2 text-sm font-medium opacity-80">
            ⌖ {page.areaLabel}
          </p>
          {page.description ? (
            <p className="provider-description">{page.description}</p>
          ) : null}
          </div>
          <div className="provider-actions">
            <QuoteRequestButton className={buttonStyles.gold} />
            {zap ? (
              <TrackedLink
                slug={page.slug}
                event="whatsapp"
                href={zap}
                external
                className="provider-button provider-whatsapp"
              >
                <ZapIcon />
                WhatsApp
              </TrackedLink>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="provider-navigation" aria-label="Nesta página">
        {page.photos.length > 0 ? <a href="#trabalhos">Trabalhos</a> : null}
        {page.services.length > 0 ? <a href="#servicos">Serviços</a> : null}
        <a href="#contato">Contato</a>
      </nav>
      <main className="provider-main">
        {page.photos.length > 0 ? (
          <section className="provider-section" aria-labelledby="trabalhos">
            <h2 id="trabalhos" className="text-xl font-semibold">
              Trabalhos
            </h2>
            <p className="provider-section-intro">Conheça de perto os trabalhos realizados.</p>
            <CompanyGallery photos={page.photos} compact />
          </section>
        ) : null}

        {page.services.length > 0 ? (
          <section className="pt-10" aria-labelledby="servicos">
            <h2 id="servicos" className="text-xl font-semibold">
              Serviços
            </h2>
            <p className="provider-section-intro">Veja como podemos ajudar no seu projeto.</p>
            {categories.length > 1 ? (
              <p className="mt-1 text-sm text-text-soft">{categories.join(" · ")}</p>
            ) : null}
            <ul className="provider-service-grid">
              {page.services.map((service) => (
                <li
                  key={service.name}
                  className="provider-service-card"
                >
                  {service.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.imagePath} alt={service.name} loading="lazy" className="provider-service-image" />
                  ) : null}
                  <div className="provider-service-copy">
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
                      <p className="provider-service-description">{service.description}</p>
                    ) : null}
                    <div className="provider-service-bottom">
                      {service.price !== null ? (
                        <p className="text-sm">
                          <span className="font-semibold">{formatBRL(service.price)}</span>
                          <span className="text-text-soft"> / {service.unit}</span>
                        </p>
                      ) : (
                        <span />
                      )}
                      <QuoteRequestButton service={service.name} className={buttonStyles.secondary} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="pt-10" aria-labelledby="contato">
          <h2 id="contato" className="text-xl font-semibold">
            Contato
          </h2>
          <p className="provider-section-intro">Fale diretamente com {page.name}.</p>
          {page.description && page.description.length > 160 ? (
            <details className="provider-about">
              <summary>Sobre {page.name}</summary>
              <p>{page.description}</p>
            </details>
          ) : null}
          <div className="provider-contact">
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
            <div className="provider-contact-actions">
              {zap ? (
                <TrackedLink
                  slug={page.slug}
                  event="whatsapp"
                  href={zap}
                  external
                  className="provider-button provider-whatsapp"
                >
                  <ZapIcon />
                  WhatsApp
                </TrackedLink>
              ) : null}
              {page.phone ? (
                <a href={`tel:${page.phone}`} className={`provider-button ${buttonStyles.secondary}`}>
                  Ligar
                </a>
              ) : null}
              {insta ? (
                <TrackedLink
                  slug={page.slug}
                  event="instagram"
                  href={insta}
                  external
                  className={`provider-button ${buttonStyles.secondary}`}
                >
                  <InstagramIcon />
                  Instagram
                </TrackedLink>
              ) : null}
              {face ? (
                <a href={face} target="_blank" rel="noreferrer" className={`provider-button ${buttonStyles.secondary}`}>
                  Facebook
                </a>
              ) : null}
              {site ? (
                <a href={site} target="_blank" rel="noreferrer" className={`provider-button ${buttonStyles.secondary}`}>
                  Site
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <a href={appUrl("/")} className="provider-footer">
          <OrcahLogo className="h-6 w-auto" />
          Página feita com Orçah
        </a>
      </main>
      </ProviderQuoteExperience>
    </div>
  );
}
