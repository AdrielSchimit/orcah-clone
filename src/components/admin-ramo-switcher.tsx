"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { titleCaseName } from "@/lib/text";

type Ramo = { id: number; name: string; slug: string; templateKey: string };

export function AdminRamoSwitcher({
  currentRamoId,
  currentRamoName,
  afterPick,
  startOpen = true,
}: {
  currentRamoId: number | null;
  currentRamoName: string;
  afterPick: "novo" | "refresh";
  startOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [query, setQuery] = useState("");
  const [outroName, setOutroName] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ramos?all=1")
      .then((response) => response.json())
      .then((data: Ramo[]) => {
        if (!cancelled) setRamos(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não deu para carregar os ramos.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const outro = ramos.find((ramo) => ramo.slug === "outro") ?? null;
  const listed = useMemo(() => {
    const rest = ramos.filter((ramo) => ramo.slug !== "outro");
    const needle = query.trim().toLowerCase();
    if (!needle) return rest;
    return rest.filter((ramo) => ramo.name.toLowerCase().includes(needle));
  }, [query, ramos]);

  async function pick(ramo: Ramo, customRamoName?: string) {
    setError("");
    setLoadingId(ramo.id);
    try {
      const response = await fetch("/api/admin/ramo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessCategoryId: ramo.id,
          customRamoName,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível trocar o molde.");
        return;
      }
      if (afterPick === "novo") {
        router.push("/painel/orcamentos/novo");
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoadingId(null);
    }
  }

  function pickOutro() {
    if (!outro) return;
    const name = titleCaseName(outroName);
    if (name.length < 2) {
      setError("Escreva o nome do ramo em Outro.");
      return;
    }
    void pick(outro, name);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-1 w-full rounded-btn border border-dashed border-ink-line bg-paper px-4 py-2.5 text-left text-xs font-medium text-text-soft"
      >
        Trocar molde · {currentRamoName}
      </button>
    );
  }

  return (
    <div className="rounded-box border border-line bg-card p-4">
      <p className="text-sm font-medium">Molde atual: {currentRamoName}</p>
      <p className="mt-1 text-xs text-text-soft">
        Só nesta conta. O orçamento e o PDF ficam na sua empresa.
      </p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar ramo"
        className="mt-3 w-full rounded-btn border border-line bg-paper px-3 py-2 text-sm"
      />
      {afterPick === "novo" ? (
        <button
          type="button"
          onClick={() => {
            router.push("/painel/orcamentos/novo");
            router.refresh();
          }}
          className="mt-3 min-h-12 w-full rounded-btn bg-gold px-4 text-sm font-semibold text-ink hover:bg-gold-press"
        >
          Continuar com {currentRamoName}
        </button>
      ) : null}
      <ul className="mt-3 max-h-72 overflow-auto rounded-xl border border-line">
        {listed.map((ramo) => (
          <li key={ramo.id} className="border-b border-line last:border-b-0">
            <button
              type="button"
              disabled={loadingId !== null}
              onClick={() => void pick(ramo)}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-paper disabled:opacity-60 ${
                ramo.id === currentRamoId ? "bg-gold-wash font-medium" : "text-text"
              }`}
            >
              {loadingId === ramo.id ? "Trocando…" : ramo.name}
            </button>
          </li>
        ))}
        {outro ? (
          <li className="border-t border-line bg-paper">
            <div className="px-4 py-3">
              <p className="mb-2 text-sm font-medium">Outro</p>
              <input
                value={outroName}
                onChange={(event) => setOutroName(event.target.value)}
                placeholder="Nome do ramo"
                className="mb-2 w-full rounded-btn border border-line bg-card px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={loadingId !== null}
                onClick={pickOutro}
                className="w-full rounded-btn bg-gold px-3 py-2 text-sm font-semibold text-ink disabled:opacity-60"
              >
                {loadingId === outro.id ? "Trocando…" : "Usar Outro"}
              </button>
            </div>
          </li>
        ) : null}
      </ul>
      {error ? <p className="mt-2 text-sm text-no">{error}</p> : null}
    </div>
  );
}
