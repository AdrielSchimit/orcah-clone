"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@/components/phone-input";
import { formatPhoneBR } from "@/lib/phone";

export type SupplierRow = { id: number; name: string; store: string | null; whatsapp: string };

const input = "min-h-12 w-full rounded-btn border border-line bg-card px-4";

export function SupplierForm({ onSaved }: { onSaved?: (supplier: SupplierRow) => void }) {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/vendedores", {
        method: "POST",
        body: JSON.stringify({ name: data.get("name"), store: data.get("store"), whatsapp }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; supplier?: SupplierRow };
      if (!response.ok || !body.supplier) {
        setError(body.error ?? "Não consegui salvar.");
        return;
      }
      form.reset();
      setWhatsapp("");
      onSaved?.(body.supplier);
      router.refresh();
    } catch {
      setError("Sem internet agora. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-box border border-line bg-card p-4">
      <label className="text-sm font-medium">
        Nome do vendedor
        <input name="name" required autoComplete="off" className={`${input} mt-1`} />
      </label>
      <label className="text-sm font-medium">
        Loja <span className="font-normal text-text-soft">(opcional)</span>
        <input name="store" autoComplete="off" className={`${input} mt-1`} />
      </label>
      <label className="text-sm font-medium">
        WhatsApp
        <PhoneInput value={whatsapp} onValueChange={setWhatsapp} required className={`${input} mt-1`} />
      </label>
      {error ? <p className="text-sm text-no">{error}</p> : null}
      <button type="submit" disabled={saving} className="min-h-12 rounded-btn bg-gold px-4 text-sm font-semibold text-ink disabled:opacity-60">
        {saving ? "Salvando…" : "Salvar vendedor"}
      </button>
    </form>
  );
}

export function SuppliersPanel({ suppliers }: { suppliers: SupplierRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(suppliers.length === 0);

  async function remove(supplier: SupplierRow) {
    if (!window.confirm(`Remover ${supplier.name}?`)) return;
    await fetch(`/api/vendedores/${supplier.id}`, { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Vendedores</h1>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-h-12 rounded-btn bg-gold px-4 text-sm font-semibold text-ink"
        >
          {open ? "Fechar" : "+ Novo vendedor"}
        </button>
      </div>
      {open ? (
        <div className="mb-5">
          <SupplierForm />
        </div>
      ) : null}
      {suppliers.length === 0 ? (
        <p className="text-sm text-text-soft">Cadastre os vendedores e lojas de quem você compra material.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-card">
          {suppliers.map((supplier) => (
            <li key={supplier.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{supplier.name}</p>
                <p className="truncate text-sm text-text-soft">
                  {[supplier.store, formatPhoneBR(supplier.whatsapp)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(supplier)}
                className="min-h-12 px-3 text-sm font-medium text-no"
                aria-label={`Remover ${supplier.name}`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
