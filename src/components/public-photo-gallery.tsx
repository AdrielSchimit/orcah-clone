"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Photo = {
  id: number;
  path: string;
  caption: string | null;
};

export function PublicPhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null ? photos[index] : null;

  useEffect(() => {
    if (index === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIndex(null);
      if (event.key === "ArrowRight") {
        setIndex((current) => (current === null ? current : (current + 1) % photos.length));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length));
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, photos.length]);

  if (photos.length === 0) return null;

  return (
    <section className="mt-4">
      <h2 className="mb-2 px-1 text-sm font-semibold">{title}</h2>
      <div className={photos.length === 1 ? "grid grid-cols-1" : "grid grid-cols-2 gap-2"}>
        {photos.map((photo, photoIndex) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setIndex(photoIndex)}
            className="overflow-hidden rounded-box border border-line bg-card text-left"
            aria-label={photo.caption ? `Ampliar foto: ${photo.caption}` : "Ampliar foto"}
          >
            <Image
              src={photo.path}
              alt={photo.caption || title}
              width={800}
              height={600}
              className="h-auto w-full object-cover"
            />
            {photo.caption ? (
              <span className="block px-3 py-2 text-sm text-text-soft">{photo.caption}</span>
            ) : null}
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-40 flex flex-col bg-ink"
          role="dialog"
          aria-modal="true"
          aria-label={open.caption || title}
        >
          <div className="flex items-center justify-between px-4 py-3 text-ink-text">
            <p className="text-sm">
              {photos.length > 1 ? `${(index ?? 0) + 1} de ${photos.length}` : "Foto"}
            </p>
            <button type="button" onClick={() => setIndex(null)} className="min-h-12 px-3 text-sm font-medium">
              Fechar
            </button>
          </div>
          <div className="relative min-h-0 w-full flex-1">
            <Image
              src={open.path}
              alt={open.caption || title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-ink-text">
            {photos.length > 1 ? (
              <button
                type="button"
                onClick={() => setIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length))}
                className="min-h-12 px-3 text-sm font-medium"
              >
                Anterior
              </button>
            ) : (
              <span />
            )}
            {open.caption ? <p className="min-w-0 flex-1 text-center text-sm text-ink-soft">{open.caption}</p> : null}
            {photos.length > 1 ? (
              <button
                type="button"
                onClick={() => setIndex((current) => (current === null ? current : (current + 1) % photos.length))}
                className="min-h-12 px-3 text-sm font-medium"
              >
                Próxima
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
