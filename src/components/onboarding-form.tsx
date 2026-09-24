"use client";

import { FormEvent, useEffect, useState } from "react";
import { RamoPicker } from "@/components/ramo-picker";
import { titleCaseName } from "@/lib/text";

type State = { id: number; name: string; uf: string };

export function OnboardingForm({ defaultWhatsapp }: { defaultWhatsapp?: string }) {
  const [states, setStates] = useState<State[]>([]);
  const [stateId, setStateId] = useState("");
  const [cityName, setCityName] = useState("");
  const [servesRegion, setServesRegion] = useState(false);
  const [ramoId, setRamoId] = useState<number | "">("");
  const [customRamoName, setCustomRamoName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/localidades/estados")
      .then((response) => response.json())
      .then(setStates);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          whatsapp: form.get("whatsapp"),
          businessCategoryId: ramoId,
          customRamoName,
          stateId,
          cityName,
          servesRegion,
        }),
      });
      const data = (await response.json()) as { error?: string; next?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      window.location.assign(data.next ?? "/painel");
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">Nome da empresa</span>
        <input
          name="name"
          required
          placeholder="João Elétrica"
          className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base"
        />
      </label>
      <RamoPicker
        value={ramoId}
        customName={customRamoName}
        onChange={(id, _name, custom) => {
          setRamoId(id);
          setCustomRamoName(custom ?? "");
        }}
      />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">WhatsApp</span>
        <input
          name="whatsapp"
          required
          defaultValue={defaultWhatsapp}
          placeholder="49 99999-0000"
          className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">Estado</span>
        <select
          value={stateId}
          onChange={(event) => setStateId(event.target.value)}
          required
          className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base"
        >
          <option value="">Selecione</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name} ({state.uf})
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">Cidade</span>
        <input
          value={cityName}
          onChange={(event) => setCityName(event.target.value)}
          onBlur={() => setCityName((current) => titleCaseName(current))}
          disabled={!stateId}
          placeholder={stateId ? "Ex.: Maravilha" : "Escolha o estado primeiro"}
          className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-text-soft">Opcional. Pode deixar em branco.</p>
      </label>
      <label className="flex items-start gap-3 rounded-box border border-line bg-paper p-4">
        <input
          type="checkbox"
          checked={servesRegion}
          onChange={(event) => setServesRegion(event.target.checked)}
          className="mt-1 size-4 accent-ink"
        />
        <span>
          <span className="block text-sm font-medium text-text">Trabalho na região</span>
          <span className="text-sm text-text-soft">
            Atendo também as cidades próximas. No perfil aparece “e Região”.
          </span>
        </span>
      </label>
      {error ? <p className="text-sm text-no">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Entrar no Orçah"}
      </button>
    </form>
  );
}
