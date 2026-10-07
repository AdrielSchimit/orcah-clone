"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatBRL } from "@/lib/money";
import type { EditableService } from "@/components/service-form";
import { ServiceCreateModal } from "@/components/service-create-modal";
import buttons from "@/components/home/home-buttons.module.css";
import styles from "@/app/painel/pagina/page.module.css";

type Item = EditableService & { sortOrder: number };

export function ServiceList({ services, editor }: { services: Item[]; editor?: {ramo:string;defaults:{nameExample:string;units:string[];defaultUnit:string;suggestions:string[]}} }) {
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
    if(busy) return;
    setError("");
    const value = !item[field];
    if(field === "featured" && value && items.filter(row=>row.featured).length >= 3) {
      setError("Você pode destacar até 3 serviços. Remova um destaque para escolher outro.");return;
    }
    setBusy(true);
    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, [field]: value } : row)));
    const response = await fetch(`/api/servicos/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, [field]: !value } : row)));
      const data=await response?.json().catch(()=>null);
      setError(data?.error ?? "Não foi possível salvar.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      {error ? <p className="mb-3 text-sm text-no">{error}</p> : null}
      <ul className={editor ? styles.serviceGrid : "grid grid-cols-1 gap-3 md:grid-cols-2"}>
        {items.map((item, index) => editor ? (
          <li key={item.id} className={styles.serviceCard} data-active={item.active}>
            <button type="button" disabled={busy} aria-pressed={item.featured} aria-label={item.featured ? `Remover destaque de ${item.name}` : `Destacar ${item.name}`} title={item.featured ? "Remover destaque" : "Destacar no site (até 3)"} onClick={()=>void toggle(item,"featured")} className={styles.serviceStar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={item.featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path strokeLinejoin="round" d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9L12 3Z"/></svg>
            </button>
            <div className={styles.serviceCardInfo}>
              {item.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imagePath} alt="" loading="lazy" className={styles.serviceThumbnail}/>
              ) : <span className={styles.serviceThumbnail}>{item.name.slice(0,1).toUpperCase()}</span>}
              <div className={styles.serviceCardText}><h3>{item.name}</h3><p>{[item.category,Number(item.defaultPrice)>0 ? `${formatBRL(item.defaultPrice)} / ${item.unit}` : null].filter(Boolean).join(" · ") || "Preço a combinar"}</p>
                <div className={styles.serviceBadges}><span data-state={item.active ? "active" : "inactive"}>{item.active ? "Na página" : "Desativado"}</span>{item.featured && <span data-state="featured">★ Destaque</span>}{Number(item.defaultPrice)>0 && <span>{item.showPrice ? "Preço visível" : "Preço oculto na página"}</span>}</div>
              </div>
            </div>
            <div className={styles.serviceCardActions}>
              <ServiceCreateModal label="Editar" service={item} serviceCount={items.length} ramo={editor.ramo} defaults={editor.defaults} categories={[...new Set(items.flatMap(row=>row.category ? [row.category] : []))]} className={`${buttons.secondary} ${styles.action}`}/>
              <button type="button" disabled={busy} onClick={()=>void toggle(item,"active")} className={styles.serviceSmallAction}>{item.active ? "Desativar" : "Ativar"}</button>
            </div>
          </li>
        ) : (
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
                      .join(" · ") || "Preço a combinar"}
                  </p>
                </Link>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
                  {item.featured ? <span className="rounded-full bg-gold-wash px-2 py-0.5 text-gold-deep">★ Destaque</span> : null}
                  {item.active ? (
                    <span className="rounded-full bg-ok-wash px-2 py-0.5 text-ok">Na página</span>
                  ) : (
                    <span className="rounded-full bg-paper-alt px-2 py-0.5 text-text-soft">Desativado</span>
                  )}
                  {Number(item.defaultPrice) > 0 ? (
                    <span className="rounded-full bg-paper px-2 py-0.5 text-text-soft">
                      {item.showPrice ? "Preço visível" : "Preço oculto na página"}
                    </span>
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
