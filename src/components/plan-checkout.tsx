"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_PRICE_LABEL } from "@/lib/plan-constants";

type Tab = "pix" | "card";

export function PlanCheckout({ document, initialPendingCard = false }: { document?: string | null; initialPendingCard?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialPendingCard ? "card" : "pix");
  const [cpf, setCpf] = useState(document ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState("");
  const [image, setImage] = useState("");
  const [pendingCard, setPendingCard] = useState(initialPendingCard);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!payload && !pendingCard) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch("/api/plano/status", { signal: controller.signal, cache: "no-store" });
        if (response.ok) {
          const state = await response.json() as { paid?: boolean; billingStatus?: string };
          if (state.paid || state.billingStatus === "canceled") { router.refresh(); return; }
        }
      } catch { /* Temporary failure; retry while mounted. */ }
      if (!controller.signal.aborted) timer = setTimeout(poll, 4000);
    }
    timer = setTimeout(poll, 4000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [payload, pendingCard, router]);

  async function createPix(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/plano/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: cpf }),
      });
      const data = (await response.json()) as { error?: string; payload?: string; image?: string };
      if (!response.ok) {
        setError(data.error ?? "Não gerou o Pix.");
        return;
      }
      setPayload(data.payload ?? "");
      setImage(data.image ?? "");
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function payCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/plano/cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: cpf,
          holderName: form.get("holderName"),
          number: form.get("number"),
          expiry: form.get("expiry"),
          ccv: form.get("ccv"),
          postalCode: form.get("postalCode"),
          addressNumber: form.get("addressNumber"),
        }),
      });
      const data = (await response.json()) as { error?: string; pending?: boolean };
      if (!response.ok) {
        setError(data.error ?? "Cartão não autorizado.");
        return;
      }
      setPendingCard(Boolean(data.pending));
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setError("Não foi possível copiar automaticamente. Tente novamente."); }
  }

  return (
    <div className="mt-5">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("pix")}
          disabled={pendingCard}
          className={`min-h-12 rounded-btn px-4 text-sm font-semibold ${
            tab === "pix" ? "bg-gold text-ink" : "border border-line bg-card"
          }`}
        >
          Pix
        </button>
        <button
          type="button"
          onClick={() => setTab("card")}
          className={`min-h-12 rounded-btn px-4 text-sm font-semibold ${
            tab === "card" ? "bg-gold text-ink" : "border border-line bg-card"
          }`}
        >
          Cartão
        </button>
      </div>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-sm font-medium">CPF ou CNPJ</span>
        <input
          value={cpf}
          onChange={(event) => setCpf(event.target.value)}
          placeholder="Só números"
          className="w-full rounded-btn border border-line bg-card px-4 py-3"
        />
      </label>

      {tab === "pix" ? (
        <form onSubmit={createPix} className="flex flex-col gap-3">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="QR Code Pix" className="mx-auto h-48 w-48 rounded-btn border border-line bg-card" />
          ) : null}
          {payload ? (
            <button type="button" onClick={copyPix} className="min-h-12 rounded-btn border border-line bg-card px-4 text-sm font-medium">
              {copied ? "Código copiado" : "Copiar código Pix"}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={loading || pendingCard}
            className="min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
          >
            {loading ? "Gerando…" : payload ? "Gerar Pix de novo" : `Pagar ${PLAN_PRICE_LABEL} no Pix`}
          </button>
          {payload ? (
            <p className="text-xs text-text-soft">
              Depois de pagar, esta tela libera sozinha. No computador local o Asaas não avisa sozinho; a gente
              consulta a cada poucos segundos.
            </p>
          ) : null}
        </form>
      ) : (
        <form onSubmit={payCard} className="flex flex-col gap-3">
          <input
            name="holderName"
            required
            placeholder="Nome no cartão"
            className="rounded-btn border border-line bg-card px-4 py-3"
          />
          <input
            name="number"
            required
            inputMode="numeric"
            placeholder="Número do cartão"
            className="rounded-btn border border-line bg-card px-4 py-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="expiry"
              required
              placeholder="MM/AA"
              className="rounded-btn border border-line bg-card px-4 py-3"
            />
            <input
              name="ccv"
              required
              inputMode="numeric"
              placeholder="CVV"
              className="rounded-btn border border-line bg-card px-4 py-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="postalCode"
              required
              inputMode="numeric"
              placeholder="CEP"
              className="rounded-btn border border-line bg-card px-4 py-3"
            />
            <input
              name="addressNumber"
              required
              placeholder="Nº"
              className="rounded-btn border border-line bg-card px-4 py-3"
            />
          </div>
          <button
            type="submit"
            disabled={loading || pendingCard}
            className="min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
          >
            {loading ? "Enviando…" : pendingCard ? "Aguardando confirmação do Asaas" : `Pagar ${PLAN_PRICE_LABEL} no cartão`}
          </button>
          <p className="text-xs text-text-soft">Os dados são encaminhados ao Asaas pelo servidor. Não armazenamos o número do cartão.</p>
        </form>
      )}
      {pendingCard ? <p className="mt-3 text-sm text-text-soft" role="status">Aguardando confirmação do pagamento. Não envie novamente.</p> : null}
      {error ? <p className="mt-3 text-sm text-no">{error}</p> : null}
    </div>
  );
}
