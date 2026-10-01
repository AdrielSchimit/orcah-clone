"use client";

import { useEffect } from "react";
import {
  ProviderProfileContent,
  type ProviderProfileData,
} from "@/components/prestadores/provider-profile-content";

export function MobileProviderProfile({
  open,
  profile,
  loading,
  error,
  onClose,
}: {
  open: boolean;
  profile: ProviderProfileData | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  useEffectBodyLock(open);

  if (!open) return null;

  function scrollToQuote() {
    document.getElementById("pedir-orcamento-prestador")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden" role="dialog" aria-modal="true">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-card/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-btn px-2 text-sm font-semibold text-text"
        >
          ← Voltar
        </button>
        <p className="truncate text-sm font-semibold">{profile?.name ?? "Perfil"}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {loading ? <p className="text-sm text-text-soft">Carregando perfil…</p> : null}
        {error ? <p className="text-sm text-no">{error}</p> : null}
        {profile ? <ProviderProfileContent profile={profile} showInlineQuote /> : null}
      </div>
      {profile ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={scrollToQuote}
            className="flex min-h-12 w-full items-center justify-center rounded-btn bg-gold text-base font-semibold text-ink"
          >
            Pedir orçamento
          </button>
        </div>
      ) : null}
    </div>
  );
}

function useEffectBodyLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}
