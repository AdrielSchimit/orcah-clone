"use client";

import { useEffect, useState } from "react";

type Photo = { id: number; path: string; title: string | null };

/** Galeria leve da página pública: grade + foto ampliada. Sem slider. */
export function CompanyGallery({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null ? photos[index] : null;

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIndex(null);
      if (event.key === "ArrowRight") setIndex((current) => (current === null ? current : (current + 1) % photos.length));
      if (event.key === "ArrowLeft") setIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo, photoIndex) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setIndex(photoIndex)}
            className="group relative aspect-square overflow-hidden rounded-box bg-paper-alt"
            aria-label={photo.title ? `Ampliar: ${photo.title}` : "Ampliar foto"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.path}
              alt={photo.title || "Trabalho realizado"}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {photo.title ? (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-left text-xs font-medium text-white">
                {photo.title}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          onClick={() => setIndex(null)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80">
            <span>{photos.length > 1 ? `${(index ?? 0) + 1} de ${photos.length}` : "Foto"}</span>
            <button type="button" className="min-h-11 min-w-11 text-2xl text-white" aria-label="Fechar">
              ×
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.path} alt={open.title || "Trabalho realizado"} className="max-h-full max-w-full object-contain" />
          </div>
          {open.title ? <p className="px-4 pb-6 text-center text-sm text-white/80">{open.title}</p> : null}
        </div>
      ) : null}
    </>
  );
}
