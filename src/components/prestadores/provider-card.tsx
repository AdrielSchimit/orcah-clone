import type { ProviderListItem } from "@/lib/provider-search";
import { ProviderAvatar } from "@/components/prestadores/provider-avatar";

export function ProviderCard({
  provider,
  onOpenProfile,
  onRequestQuote,
}: {
  provider: ProviderListItem;
  onOpenProfile: () => void;
  onRequestQuote: () => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-box border border-line bg-card shadow-card">
      <button type="button" onClick={onOpenProfile} className="group block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-paper-alt">
          <ProviderAvatar
            name={provider.name}
            logoPath={provider.logoPath}
            coverPath={provider.coverPath}
            className="h-full w-full transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <div className="p-4">
          <h3 className="text-base font-semibold leading-snug text-text">{provider.name}</h3>
          <p className="mt-0.5 text-sm text-text-soft">{provider.category}</p>
          <p className="mt-2 text-xs font-medium text-text-soft">
            {provider.badge === "novo" ? "Novo no Orçah" : null}
          </p>
          <p className="mt-2 text-sm text-text-soft">{provider.place}</p>
          {provider.servesSearchRegion ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ok">
              <CheckIcon />
              Atende sua região
            </p>
          ) : null}
        </div>
      </button>
      <div className="mt-auto grid gap-2 border-t border-line p-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onOpenProfile}
          className="min-h-11 rounded-btn border border-line bg-card px-3 text-sm font-semibold text-text hover:bg-paper"
        >
          Ver perfil
        </button>
        <button
          type="button"
          onClick={onRequestQuote}
          className="min-h-11 rounded-btn bg-gold px-3 text-sm font-semibold text-ink hover:bg-gold-press"
        >
          Pedir orçamento
        </button>
      </div>
    </article>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
