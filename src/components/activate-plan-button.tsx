"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_PRICE_LABEL } from "@/lib/plan-constants";

export function ActivatePlanButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function activate() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/plano/ativar", { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível ativar.");
        return;
      }
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={activate}
        disabled={loading}
        className="min-h-12 w-full rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Ativando…" : `Ativar plano · ${PLAN_PRICE_LABEL}`}
      </button>
      <p className="mt-2 text-xs text-text-soft">
        Pagamento online (cartão/PIX) entra depois. Por agora o plano local fica ativo por 30 dias.
      </p>
      {error ? <p className="mt-2 text-sm text-no">{error}</p> : null}
    </div>
  );
}
