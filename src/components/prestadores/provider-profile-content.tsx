"use client";

import { CompanyGallery } from "@/components/company-gallery";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { ServiceCoverPlaceholder } from "@/components/service-cover-placeholder";
import { formatBRL } from "@/lib/money";

export type ProviderProfileData = {
  slug: string;
  name: string;
  category: string;
  coverCategory?: string | null;
  place: string;
  servesSearchRegion: boolean;
  description: string | null;
  logoPath: string | null;
  coverPath?: string | null;
  serviceAreaText: string;
  serviceAreaLabel: string;
  openingHours: string | null;
  reviewBadge: string;
  services: {
    name: string;
    description: string | null;
    category: string | null;
    price: number | null;
    unit: string;
  }[];
  photos: { path: string; title: string | null }[];
};

export function ProviderProfileContent({
  profile,
  onRequestQuoteScroll,
  showInlineQuote,
}: {
  profile: ProviderProfileData;
  onRequestQuoteScroll?: () => void;
  showInlineQuote?: boolean;
}) {
  const cover = profile.coverPath;
  const serviceNames = profile.services.map((service) => service.name);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-box border border-line bg-card shadow-card">
        <div className={cover ? "relative aspect-[21/9] min-h-[10rem] bg-paper-alt" : "relative bg-paper-alt"}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <ServiceCoverPlaceholder category={profile.coverCategory ?? profile.category} />
          )}
        </div>
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-text">{profile.name}</h2>
              <p className="mt-1 text-sm font-medium text-text-soft">{profile.category}</p>
              <p className="mt-2 text-sm text-text-soft">{profile.reviewBadge}</p>
              <p className="mt-1 text-sm text-text-soft">{profile.place}</p>
              {profile.servesSearchRegion ? (
                <p className="mt-2 text-sm font-medium text-ok">✓ Atende sua região</p>
              ) : null}
            </div>
            {onRequestQuoteScroll ? (
              <button
                type="button"
                onClick={onRequestQuoteScroll}
                className="min-h-12 shrink-0 rounded-btn bg-gold px-5 text-sm font-semibold text-ink hover:bg-gold-press"
              >
                Pedir orçamento
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {profile.description ? (
        <section>
          <h3 className="text-lg font-semibold">Apresentação</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-soft">{profile.description}</p>
        </section>
      ) : null}

      {profile.services.length > 0 ? (
        <section>
          <h3 className="text-lg font-semibold">Serviços</h3>
          <ul className="mt-3 divide-y divide-line rounded-box border border-line bg-card">
            {profile.services.map((service) => (
              <li key={service.name} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-text">{service.name}</p>
                  {service.description ? <p className="mt-0.5 text-text-soft">{service.description}</p> : null}
                </div>
                {service.price != null ? (
                  <span className="shrink-0 font-medium text-text">{formatBRL(service.price)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.photos.length > 0 ? (
        <section>
          <h3 className="text-lg font-semibold">Trabalhos realizados</h3>
          <div className="mt-3">
            <CompanyGallery photos={profile.photos} />
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="text-lg font-semibold">Sobre</h3>
        <dl className="mt-3 space-y-2 text-sm text-text-soft">
          <div>
            <dt className="font-medium text-text">Cidade-base</dt>
            <dd>{profile.place}</dd>
          </div>
          {profile.openingHours ? (
            <div>
              <dt className="font-medium text-text">Horário de atendimento</dt>
              <dd>{profile.openingHours}</dd>
            </div>
          ) : null}
          {profile.description ? (
            <div>
              <dt className="font-medium text-text">Descrição</dt>
              <dd>{profile.description}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Área de atendimento</h3>
        <p className="mt-2 text-sm text-text-soft">{profile.serviceAreaText}</p>
        <p className="mt-1 text-sm text-text-soft">{profile.serviceAreaLabel}</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Avaliações</h3>
        <p className="mt-2 text-sm text-text-soft">{profile.reviewBadge}</p>
      </section>

      {showInlineQuote ? (
        <section id="pedir-orcamento-prestador">
          <QuoteRequestForm slug={profile.slug} defaultService={profile.category} services={serviceNames} />
        </section>
      ) : null}
    </div>
  );
}
