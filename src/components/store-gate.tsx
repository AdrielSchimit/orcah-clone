"use client";

import { useEffect } from "react";
import { OrcahLogo } from "@/components/orcah-logo";

export function StoreGate({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-brand-wash px-6 text-center text-text">
      <OrcahLogo className="mb-6 h-10 w-auto" />
      <span className="mb-5 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-gold" />
      <p className="text-lg font-semibold">Abrindo a área da sua loja</p>
      <p className="mt-2 text-sm text-text-soft">Só um instante.</p>
    </div>
  );
}
