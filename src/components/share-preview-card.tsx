import type { SharePreview } from "@/lib/share-preview";

/** Card do link no painel. Largura de celular: é assim que o preview aparece no Instagram. */
export function SharePreviewCard({ preview }: { preview: SharePreview }) {
  return (
    <article className="w-full max-w-sm overflow-hidden rounded-box border border-line bg-card">
      <div className="bg-ink px-4 py-5 text-ink-text">
        <div className="h-1 w-10 rounded-full bg-gold" />
        {preview.eyebrow ? <p className="mt-3 text-xs font-medium uppercase tracking-[0.04em] text-gold">{preview.eyebrow}</p> : null}
        <h3 className="mt-1 text-xl font-semibold leading-tight">{preview.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{preview.description}</p>
      </div>
      <p className="truncate px-4 py-3 text-xs text-text-soft">{preview.footer}</p>
    </article>
  );
}
