"use client";

import { useEffect, useState } from "react";

type Mode = "idle" | "reject" | "revision";

const rejectOptions = [
  { id: "preco", label: "Preço" },
  { id: "prazo", label: "Prazo" },
  { id: "nao-sera-realizado", label: "Serviço não será realizado" },
  { id: "outra-empresa", label: "Escolhi outra empresa" },
  { id: "outro", label: "Outro" },
];

export function PublicBudgetActions({
  token,
  initialStatus,
  totalLabel,
}: {
  token: string;
  initialStatus: string;
  totalLabel: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/publico/orcamentos/${token}/visualizar`, { method: "POST" }).catch(() => {});
  }, [token]);

  async function respond(action: string, extra?: { reason?: string; message?: string }) {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/publico/orcamentos/${token}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = (await response.json()) as { error?: string; status?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível responder.");
        return;
      }
      setStatus(data.status ?? status);
      setMode("idle");
      setMessage("");
      setReason("");
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "approved") {
    return (
      <p className="rounded-box bg-ok-wash p-4 text-center font-medium text-ok">
        Orçamento aprovado. A empresa foi avisada.
      </p>
    );
  }
  if (status === "rejected") {
    return <p className="rounded-box bg-no-wash p-4 text-center font-medium text-no">Você recusou este orçamento.</p>;
  }
  if (status === "waiting") {
    return (
      <p className="rounded-box bg-wait-wash p-4 text-center font-medium text-wait">
        Pedido de alteração enviado. A empresa vai ajustar e te avisar.
      </p>
    );
  }
  if (status === "expired") {
    return <p className="rounded-box bg-card p-4 text-center text-text-soft">Este orçamento expirou.</p>;
  }

  return (
    <>
      <div className="flex flex-col">
        <button
          type="button"
          disabled={loading}
          onClick={() => setMode(mode === "revision" ? "idle" : "revision")}
          className="min-h-12 text-left text-sm font-medium text-text"
        >
          Quero alterar
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setMode(mode === "reject" ? "idle" : "reject")}
          className="min-h-12 text-left text-sm font-medium text-text-soft"
        >
          Não tenho interesse
        </button>

        {mode === "reject" ? (
          <div className="rounded-box border border-line bg-card p-4">
            <p className="mb-2 text-sm font-medium">Por quê?</p>
            <div className="flex flex-col gap-2">
              {rejectOptions.map((option) => (
                <label key={option.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === option.id}
                    onChange={() => setReason(option.id)}
                    className="accent-ink"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Opcional: conte um pouco mais"
              rows={2}
              className="mt-3 w-full rounded-btn border border-line px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => respond("reject", { reason, message })}
              className="mt-3 min-h-12 w-full rounded-btn border border-line bg-card px-4 text-sm font-semibold"
            >
              Confirmar recusa
            </button>
          </div>
        ) : null}

        {mode === "revision" ? (
          <div className="rounded-box border border-line bg-card p-4">
            <p className="mb-2 text-sm font-medium">O que gostaria de mudar?</p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ex.: Consigo fazer sem trocar o material?"
              rows={3}
              className="w-full rounded-btn border border-line px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => respond("revision", { message })}
              className="mt-3 min-h-12 w-full rounded-btn border border-line bg-card px-4 text-sm font-semibold"
            >
              Enviar pedido
            </button>
          </div>
        ) : null}

        {error ? <p className="text-sm text-no">{error}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-soft">Total</p>
            <p className="text-lg font-semibold leading-6 text-text">{totalLabel}</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => respond("approve")}
            className="min-h-12 flex-1 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
          >
            Aprovar
          </button>
        </div>
      </div>
    </>
  );
}
