"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePicker } from "@/components/file-picker";
import type { TemplateConfig } from "@/lib/templates";

type Photo = { id: number; path: string; caption: string | null };

export function BudgetPhotosForm({
  budgetId,
  photos,
  template,
  canEdit,
}: {
  budgetId: number;
  photos: Photo[];
  template: TemplateConfig;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!template.photos.enabled && photos.length === 0) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const caption = String(data.get("caption") ?? "").trim();
    if (template.photos.captionRequired && !caption) {
      setError("Coloque um subtítulo na foto.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/orcamentos/${budgetId}/fotos`, { method: "POST", body: data });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Não foi possível enviar.");
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(photoId: number) {
    await fetch(`/api/orcamentos/${budgetId}/fotos/${photoId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="mb-6 rounded-box border border-line bg-card p-4">
      <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">{template.photos.sectionTitle}</h2>
      {template.photos.hint ? <p className="mb-3 text-sm text-text-soft">{template.photos.hint}</p> : null}
      {canEdit ? (
        <form onSubmit={onSubmit} className="mb-4 flex flex-col gap-3">
          <FilePicker
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
            label="Foto"
            hint="JPG, PNG ou WebP"
          />
          <input
            name="caption"
            list={`captions-${budgetId}`}
            placeholder="Subtítulo da foto"
            className="rounded-btn border border-line px-4 py-3"
          />
          {template.photos.captionSuggestions?.length ? (
            <datalist id={`captions-${budgetId}`}>
              {template.photos.captionSuggestions.map((caption) => (
                <option key={caption} value={caption} />
              ))}
            </datalist>
          ) : null}
          {error ? <p className="text-sm text-no">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-btn border border-line bg-paper px-4 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Adicionar foto"}
          </button>
        </form>
      ) : null}
      {photos.length === 0 ? (
        <p className="text-sm text-text-soft">Nenhuma foto neste orçamento.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-btn border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.path} alt={photo.caption || ""} className="h-28 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-2 py-2">
                <span className="truncate text-xs text-text-soft">{photo.caption || "Foto"}</span>
                {canEdit ? (
                  <button type="button" onClick={() => remove(photo.id)} className="text-xs text-no">
                    Remover
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
