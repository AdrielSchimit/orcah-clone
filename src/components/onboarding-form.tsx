"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RamoPicker } from "@/components/ramo-picker";
import { buildServiceDescription } from "@/lib/onboarding-description";
import { titleCaseName } from "@/lib/text";

type State = { id: number; name: string; uf: string };

export function OnboardingForm({ defaultWhatsapp }: { defaultWhatsapp?: string }) {
  const [states, setStates] = useState<State[]>([]);
  const [stateId, setStateId] = useState("");
  const [cityName, setCityName] = useState("");
  const [servesRegion, setServesRegion] = useState(false);
  const [ramoId, setRamoId] = useState<number | "">("");
  const [ramoName, setRamoName] = useState("");
  const [customRamoName, setCustomRamoName] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEdited, setDescriptionEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/localidades/estados")
      .then((response) => response.json())
      .then(setStates);
  }, []);

  const descriptionSuggestion = useMemo(
    () =>
      buildServiceDescription({
        ramo: customRamoName || ramoName,
        city: cityName,
        servesRegion,
      }),
    [cityName, customRamoName, ramoName, servesRegion],
  );

  const effectiveDescription = descriptionEdited ? description : descriptionSuggestion;

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
          description: effectiveDescription,
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
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-5">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-soft">
          O essencial
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text">Nome da empresa</span>
          <input
            name="name"
            required
            placeholder="João Elétrica"
            className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base"
          />
        </label>

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
      </div>

      <div className="space-y-4 border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-soft">
          Onde você atende
        </p>

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
            <span className="block text-sm font-medium text-text">Atendo também a região</span>
            <span className="text-sm text-text-soft">
              Vamos usar “e região” na apresentação da sua empresa.
            </span>
          </span>
        </label>
      </div>

      <div className="space-y-4 border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-soft">
          Seu serviço
        </p>

        <RamoPicker
          value={ramoId}
          customName={customRamoName}
          onChange={(id, name, custom) => {
            setRamoId(id);
            setRamoName(custom || name);
            setCustomRamoName(custom ?? "");
            setDescriptionEdited(false);
          }}
        />

        {ramoId ? (
          <div className="rounded-box border border-gold/60 bg-gold/10 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">Apresentação pronta</p>
                <p className="text-xs text-text-soft">
                  O Orçah montou uma frase com o que você informou.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-ink">
                Sugestão
              </span>
            </div>

            <textarea
              value={effectiveDescription}
              onChange={(event) => {
                setDescription(event.target.value);
                setDescriptionEdited(true);
              }}
              maxLength={500}
              rows={3}
              aria-label="Apresentação da empresa"
              className="w-full resize-none rounded-btn border border-line bg-card px-4 py-3 text-base leading-relaxed text-text"
            />

            {descriptionEdited && descriptionSuggestion && effectiveDescription !== descriptionSuggestion ? (
              <button
                type="button"
                onClick={() => {
                  setDescription("");
                  setDescriptionEdited(false);
                }}
                className="mt-2 text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4"
              >
                Usar a sugestão do Orçah
              </button>
            ) : (
              <p className="mt-2 text-xs text-text-soft">
                Se estiver boa, não precisa fazer nada. Você poderá alterar depois.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-no">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Preparando sua empresa…" : "Entrar no Orçah"}
      </button>
    </form>
  );
}
