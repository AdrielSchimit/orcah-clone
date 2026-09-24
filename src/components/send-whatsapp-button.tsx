"use client";

import { useState } from "react";

export function SendWhatsAppButton({ budgetId }: { budgetId: number }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/orcamentos/${budgetId}/enviar`, { method: "POST" });
      const data = (await response.json()) as { error?: string; href?: string };
      if (!response.ok || !data.href) {
        setError(data.error ?? "Não foi possível abrir o WhatsApp.");
        return;
      }
      window.location.href = data.href;
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
        onClick={send}
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-btn bg-zap px-4 text-base font-semibold text-ink disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.87 9.87 0 0 0 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.25 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29z" />
        </svg>
        {loading ? "Abrindo…" : "Enviar pelo WhatsApp"}
      </button>
      {error ? <p className="mt-2 text-sm text-no">{error}</p> : null}
    </div>
  );
}
