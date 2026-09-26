"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatBRL } from "@/lib/money";
import type { EditableService } from "@/components/service-form";

type Item = EditableService & { sortOrder: number };

export function ServiceList({ services }: { services: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(services);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length || busy) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = items;
    setItems(next);
    setBusy(true);
    setError("");
    const response = await fetch("/api/servicos/ordem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setItems(previous);
      setError("Não foi possível mudar a ordem.");
      return;
    }
    router.refresh();
  }

  async function toggle(item: Item, field: "active" | "featured") {
    setError("");
    const value = !item[field];
    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, [field]: value } : row)));
    const response = await fetch(`/api/servicos/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => null);
    if (!response?.ok) {
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, [field]: !value } : row)));
      setError("Não foi possível salvar.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      {error ? <p className="mb-3 text-sm text-no">{error}</p> : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`rounded-box border bg-card p-3 ${item.active ? "border-line" : "border-dashed border-line opacity-70"}`}
          >
            <div className="flex gap-3">
              <Link href={`/painel/servicos/${item.id}`} className="shrink-0" aria-label={`Editar ${item.name}`}>
                {item.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imagePath} alt="" className="h-20 w-20 rounded-xl object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-gold-wash text-2xl font-semibold text-gold-deep">
                    {item.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/painel/servicos/${item.id}`} className="block">
                  <p className="font-semibold leading-snug">{item.name}</p>
                  <p className="mt-0.5 truncate text-xs text-text-soft">
                    {[item.category, Number(item.defaultPrice) > 0 ? `${formatBRL(item.defaultPrice)}/${item.unit}` : null]
                      .filter(Boolean)
                      .join(" · ") || "Sem categoria"}
                  </p>
                </Link>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
                  {item.featured ? <span className="rounded-full bg-gold-wash px-2 py-0.5 text-gold-deep">★ Destaque</span> : null}
                  {item.active ? (
                    <span className="rounded-full bg-ok-wash px-2 py-0.5 text-ok">Na página</span>
                  ) : (
                    <span className="rounded-full bg-paper-alt px-2 py-0.5 text-text-soft">Desativado</span>
                  )}
                  {item.showPrice && Number(item.defaultPrice) > 0 ? (
                    <span className="rounded-full bg-paper px-2 py-0.5 text-text-soft">Preço visível</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => void move(index, -1)}
                disabled={index === 0 || busy}
                aria-label="Subir"
                className="min-h-11 rounded-btn border border-line text-lg disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => void move(index, 1)}
                disabled={index === items.length - 1 || busy}
                aria-label="Descer"
                className="min-h-11 rounded-btn border border-line text-lg disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => void toggle(item, "featured")}
                aria-pressed={item.featured}
                className={`min-h-11 rounded-btn border text-xs font-medium ${item.featured ? "border-gold bg-gold-wash text-gold-deep" : "border-line"}`}
              >
                {item.featured ? "★ Destaque" : "☆ Destacar"}
              </button>
              <button
                type="button"
                onClick={() => void toggle(item, "active")}
                className="min-h-11 rounded-btn border border-line text-xs font-medium"
              >
                {item.active ? "Desativar" : "Ativar"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
