"use client";

import { useEffect } from "react";
import {
  ProviderProfileContent,
  type ProviderProfileData,
} from "@/components/prestadores/provider-profile-content";

export function ProviderProfilePanel({
  open,
  profile,
  loading,
  error,
  onClose,
  onRequestQuote,
}: {
  open: boolean;
  profile: ProviderProfileData | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onRequestQuote: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 hidden lg:block" role="presentation">
      <button type="button" aria-label="Fechar perfil" className="absolute inset-0 bg-ink/25" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={profile?.name ?? "Perfil do prestador"}
        className="absolute inset-y-0 right-0 flex w-[min(80vw,56rem)] flex-col border-l border-line bg-paper shadow-float animate-rise"
      >
        <div className="flex items-center justify-between border-b border-line bg-card px-5 py-3">
          <p className="truncate text-sm font-semibold text-text">{profile?.name ?? "Perfil"}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-btn text-2xl text-text-soft hover:bg-paper hover:text-text"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-28">
          {loading ? <p className="text-sm text-text-soft">Carregando perfil…</p> : null}
          {error ? <p className="text-sm text-no">{error}</p> : null}
          {profile ? (
            <ProviderProfileContent
              profile={profile}
              onRequestQuoteScroll={onRequestQuote}
              showInlineQuote
            />
          ) : null}
        </div>
        {profile ? (
          <div className="border-t border-line bg-card px-5 py-3">
            <button
              type="button"
              onClick={onRequestQuote}
              className="flex min-h-12 w-full items-center justify-center rounded-btn bg-gold text-base font-semibold text-ink hover:bg-gold-press"
            >
              Pedir orçamento
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
