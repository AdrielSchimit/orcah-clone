"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SupplierForm, type SupplierRow } from "@/components/suppliers-panel";
import { formatQuantity } from "@/lib/money";

type Row = { key: number; description: string; quantity: string };
type Recent = { description: string; quantity: number };

const input = "min-h-12 rounded-btn border border-line bg-card px-3";

export function ProductQuoteForm({ suppliers: initial, recent }: { suppliers: SupplierRow[]; recent: Recent[] }) {
  const router = useRouter();
  const nextKey = useRef(1);
  const [rows, setRows] = useState<Row[]>([{ key: 0, description: "", quantity: "1" }]);
  const [suppliers, setSuppliers] = useState(initial);
  const [picked, setPicked] = useState<Set<number>>(() => new Set(initial.map((supplier) => supplier.id)));
  const [addingSupplier, setAddingSupplier] = useState(initial.length === 0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const inList = new Set(rows.map((row) => row.description.trim().toLowerCase()));
  const chips = recent.filter((item) => !inList.has(item.description.toLowerCase()));

  function addRow(description = "", quantity = "1") {
    setRows((current) => {
      const last = current[current.length - 1];
      // a linha vazia do fim é reaproveitada ao tocar num produto do histórico
      if (description && last && !last.description.trim()) {
        return [...current.slice(0, -1), { ...last, description, quantity }];
      }
      return [...current, { key: nextKey.current++, description, quantity }];
    });
  }

  function update(key: number, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function toggle(id: number) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/cotacoes", {
        method: "POST",
        body: JSON.stringify({ items: rows, supplierIds: [...picked] }),
      });
      const data = (await response.json().catch(() => ({}))) as { id?: number; error?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "Não consegui criar a cotação.");
        return;
      }
      router.push(`/painel/cotacoes/${data.id}`);
    } catch {
      setError("Sem internet agora. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-2 font-semibold">1. O que você precisa?</h2>
        {chips.length ? (
          <div className="mb-3">
            <p className="mb-1 text-sm text-text-soft">Já cotados (toque para adicionar)</p>
            <div className="flex flex-wrap gap-2">
              {chips.map((item) => (
                <button
                  key={item.description}
                  type="button"
                  onClick={() => addRow(item.description, formatQuantity(item.quantity))}
                  className="min-h-10 rounded-full border border-line bg-card px-3 text-sm"
                >
                  + {item.description}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li key={row.key} className="flex gap-2">
              <input
                aria-label={`Produto ${index + 1}`}
                placeholder="Ex.: Cimento CP II 50kg"
                value={row.description}
                onChange={(event) => update(row.key, { description: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (index === rows.length - 1 && row.description.trim()) addRow();
                  }
                }}
                autoFocus={index > 0 && index === rows.length - 1 && !row.description}
                className={`${input} min-w-0 flex-1`}
              />
              <input
                aria-label={`Quantidade do produto ${index + 1}`}
                inputMode="decimal"
                value={row.quantity}
                onChange={(event) => update(row.key, { quantity: event.target.value })}
                className={`${input} w-20 text-center`}
              />
              {rows.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Tirar produto ${index + 1}`}
                  onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                  className="min-h-12 w-10 shrink-0 text-lg text-text-soft"
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => addRow()}
          className="mt-2 min-h-12 w-full rounded-btn border border-dashed border-line text-sm font-medium"
        >
          + Adicionar produto
        </button>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">2. Para quem pedir preço?</h2>
        {suppliers.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-card">
            {suppliers.map((supplier) => (
              <li key={supplier.id}>
                <label className="flex min-h-12 items-center gap-3 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={picked.has(supplier.id)}
                    onChange={() => toggle(supplier.id)}
                    className="h-5 w-5"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{supplier.name}</span>
                    {supplier.store ? <span className="block truncate text-sm text-text-soft">{supplier.store}</span> : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : null}
        {addingSupplier ? (
          <div className="mt-2">
            <SupplierForm
              onSaved={(supplier) => {
                setSuppliers((current) => [...current, supplier]);
                setPicked((current) => new Set(current).add(supplier.id));
                setAddingSupplier(false);
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingSupplier(true)}
            className="mt-2 min-h-12 w-full rounded-btn border border-dashed border-line text-sm font-medium"
          >
            + Novo vendedor
          </button>
        )}
      </section>

      {error ? <p className="text-sm text-no">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink disabled:opacity-60"
      >
        {saving ? "Criando…" : "Criar e enviar cotação"}
      </button>
    </div>
  );
}
