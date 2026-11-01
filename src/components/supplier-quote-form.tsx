"use client";

import { useState } from "react";
import { formatBRL, formatQuantity, parseMoney } from "@/lib/money";

type Item = { id: number; description: string; quantity: number; brand: string; unitPrice: string };

const input = "min-h-12 w-full rounded-btn border border-line bg-card px-3";

export function SupplierQuoteForm({ token, items: initial, closed }: { token: string; items: Item[]; closed: boolean }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const total = items.reduce((sum, item) => sum + parseMoney(item.unitPrice) * item.quantity, 0);

  function update(id: number, patch: Partial<Item>) {
    setDone(false);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/publico/cotacoes/${token}/responder`, {
        method: "POST",
        body: JSON.stringify({
          offers: items.map((item) => ({ itemId: item.id, brand: item.brand, unitPrice: item.unitPrice })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não consegui enviar.");
        return;
      }
      setDone(true);
    } catch {
      setError("Sem internet agora. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-box border border-line bg-card p-3">
            <p className="font-medium">
              {formatQuantity(item.quantity)}× {item.description}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-text-soft">
                Marca
                <input
                  value={item.brand}
                  disabled={closed}
                  onChange={(event) => update(item.id, { brand: event.target.value })}
                  aria-label={`Marca do item ${index + 1}`}
                  className={`${input} mt-1 text-base text-text`}
                />
              </label>
              <label className="text-xs text-text-soft">
                Valor unitário (R$)
                <input
                  value={item.unitPrice}
                  disabled={closed}
                  inputMode="decimal"
                  placeholder="0,00"
                  onChange={(event) => update(item.id, { unitPrice: event.target.value })}
                  aria-label={`Valor unitário do item ${index + 1}`}
                  className={`${input} mt-1 text-base text-text`}
                />
              </label>
            </div>
            {parseMoney(item.unitPrice) > 0 ? (
              <p className="mt-1 text-right text-sm text-text-soft">
                Subtotal {formatBRL(parseMoney(item.unitPrice) * item.quantity)}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-sm text-text-soft">Não tem algum item? Deixe o valor em branco.</p>
      <div className="flex items-center justify-between rounded-box border border-line bg-card p-3">
        <span className="text-sm text-text-soft">Total</span>
        <span className="text-lg font-semibold">{formatBRL(total)}</span>
      </div>
      {error ? <p className="text-sm text-no">{error}</p> : null}
      {done ? (
        <p role="status" className="rounded-box bg-ok-wash p-3 text-sm font-medium text-ok">
          Cotação enviada. Obrigado! Se precisar, corrija e envie de novo.
        </p>
      ) : null}
      {closed ? (
        <p className="rounded-box bg-paper-alt p-3 text-sm">Essa cotação já foi fechada. Obrigado!</p>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink disabled:opacity-60"
        >
          {saving ? "Enviando…" : "Enviar cotação"}
        </button>
      )}
    </div>
  );
}
