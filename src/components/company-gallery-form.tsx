"use client";

import { FilePicker } from "@/components/file-picker";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Photo = { id: number; path: string; title: string | null };

export function CompanyGalleryForm({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/empresa/fotos", { method: "POST", body: data });
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

  async function remove(id: number) {
    await fetch(`/api/empresa/fotos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="mt-5 rounded-box border border-line bg-card p-4">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Galeria — nossos trabalhos</h2>
      <form onSubmit={onSubmit} className="mb-4 flex flex-col gap-3">
        <FilePicker
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          label="Foto"
          hint="JPG, PNG ou WebP"
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Título</span>
          <input
            name="title"
            placeholder="Instalação residencial"
            className="w-full rounded-btn border border-line px-4 py-3"
          />
        </label>
        {error ? <p className="text-sm text-no">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="min-h-12 rounded-btn border border-line bg-paper px-4 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Adicionar foto"}
        </button>
      </form>
      {photos.length === 0 ? (
        <p className="text-sm text-text-soft">Nenhuma foto ainda. Elas aparecem na página pública.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.path} alt={photo.title || ""} className="h-28 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-2 py-2">
                <span className="truncate text-xs text-text-soft">{photo.title || "Foto"}</span>
                <button type="button" onClick={() => remove(photo.id)} className="text-xs text-no">
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
