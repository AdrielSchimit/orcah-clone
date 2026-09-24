"use client";

import { useEffect, useRef, useState } from "react";
import { titleCaseName } from "@/lib/text";

type Ramo = { id: number; name: string; slug: string; templateKey: string };

export function RamoPicker({
  value,
  customName,
  onChange,
}: {
  value: number | "";
  customName?: string;
  onChange: (id: number, name: string, customName?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [label, setLabel] = useState("");
  const [outroDraft, setOutroDraft] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const outro = ramos.find((ramo) => ramo.slug === "outro") ?? null;
  const visible = ramos.filter((ramo) => ramo.slug !== "outro");
  const selectedOutro = Boolean(outro && value === outro.id);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/ramos?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as Ramo[];
      setRamos(data);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    function closeIfOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && boxRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    }

    document.addEventListener("pointerdown", closeIfOutside);
    return () => document.removeEventListener("pointerdown", closeIfOutside);
  }, [open]);

  function pickListed(ramo: Ramo) {
    onChange(ramo.id, ramo.name);
    setLabel(ramo.name);
    setQuery("");
    setOutroDraft("");
    setOpen(false);
  }

  function pickOutro() {
    if (!outro) return;
    setOutroDraft(titleCaseName(query));
    onChange(outro.id, outro.name);
    setLabel(outro.name);
    setQuery("");
    setOpen(false);
  }

  function useTypedRamo() {
    if (!outro) return;
    const name = titleCaseName(outroDraft || query);
    if (name.length < 2) return;
    onChange(outro.id, name, name);
    setLabel(name);
    setOutroDraft(name);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-text">Ramo</label>
      <input
        value={open ? query : label || query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        placeholder="Ex.: encanador, construtora, marceneiro"
        className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base text-text"
        autoComplete="off"
      />
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-btn border border-line bg-card shadow-lg">
          {visible.map((ramo) => (
            <li key={ramo.id}>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-sm text-text hover:bg-paper"
                onClick={() => pickListed(ramo)}
              >
                {ramo.name}
              </button>
            </li>
          ))}
          {outro ? (
            <li className="border-t border-line">
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-sm font-medium text-text hover:bg-paper"
                onClick={pickOutro}
              >
                Outro
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
      {selectedOutro ? (
        <div className="mt-2 rounded-btn border border-line bg-paper p-3">
          <p className="mb-2 text-sm text-text-soft">
            Não está na lista? Use o nome que você digitou.
          </p>
          <div className="flex flex-col gap-2">
            <input
              value={outroDraft || customName || ""}
              onChange={(event) => setOutroDraft(event.target.value)}
              placeholder="Ex.: Instalador de antenas"
              className="w-full rounded-btn border border-line bg-card px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={useTypedRamo}
              className="rounded-btn bg-gold px-3 py-2 text-sm font-semibold text-ink"
            >
              Usar este ramo
            </button>
          </div>
        </div>
      ) : value ? (
        <p className="mt-1 text-sm text-text-soft">Selecionado: {label}</p>
      ) : null}
    </div>
  );
}
