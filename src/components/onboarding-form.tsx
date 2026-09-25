"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildCompanyDescription,
  normalizeCustomDescription,
  normalizeOnboardingPayload,
} from "@/lib/onboarding";
import { titleCaseName } from "@/lib/text";

type State = { id: number; name: string; uf: string };
type City = { id: number; name: string };
type Ramo = { id: number; name: string; slug: string; templateKey: string };
type StepKey = "name" | "whatsapp" | "location" | "region" | "ramo" | "description";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "name", label: "Empresa" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "location", label: "Cidade" },
  { key: "region", label: "Região" },
  { key: "ramo", label: "Ramo" },
  { key: "description", label: "Apresentação" },
];

const POPULAR_SLUGS = ["eletricista", "pedreiro", "pintor", "encanador", "serralheiro"];

export function OnboardingForm({ defaultWhatsapp }: { defaultWhatsapp?: string }) {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [ramoQuery, setRamoQuery] = useState("");
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp ?? "");
  const [stateId, setStateId] = useState("");
  const [cityName, setCityName] = useState("");
  const [servesRegion, setServesRegion] = useState(false);
  const [ramoId, setRamoId] = useState<number | "">("");
  const [ramoName, setRamoName] = useState("");
  const [ramoSlug, setRamoSlug] = useState("");
  const [customRamoName, setCustomRamoName] = useState("");
  const [description, setDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/localidades/estados")
      .then((response) => response.json())
      .then(setStates);
  }, []);

  useEffect(() => {
    if (!stateId) {
      return;
    }
    fetch(`/api/localidades/cidades?stateId=${stateId}`)
      .then((response) => response.json())
      .then(setCities);
  }, [stateId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/ramos?q=${encodeURIComponent(ramoQuery)}`);
      const data = (await response.json()) as Ramo[];
      setRamos(data);
    }, 150);

    return () => clearTimeout(timer);
  }, [ramoQuery]);

  const active = STEPS[step];
  const outro = ramos.find((ramo) => ramo.slug === "outro");
  const popularRamos = useMemo(() => {
    const bySlug = new Map(ramos.map((ramo) => [ramo.slug, ramo]));
    return POPULAR_SLUGS.map((slug) => bySlug.get(slug)).filter((ramo): ramo is Ramo => Boolean(ramo));
  }, [ramos]);
  const listedRamos = ramos.filter((ramo) => ramo.slug !== "outro");
  const selectedState = states.find((state) => String(state.id) === stateId);
  const suggestedDescription = buildCompanyDescription({
    categoryName: ramoName,
    categorySlug: ramoSlug,
    customRamoName,
    cityName,
    servesRegion,
  });
  const currentDescription = editingDescription ? description : description || suggestedDescription;

  function compactAnswers() {
    const answers = [
      name,
      whatsapp,
      selectedState ? [cityName, selectedState.uf].filter(Boolean).join(" - ") : cityName,
      step > 3 ? (servesRegion ? "Atende a região" : "Só a cidade principal") : "",
      ramoName,
    ];

    return answers.slice(0, step).filter(Boolean);
  }

  function pickRamo(ramo: Ramo, customName?: string) {
    const pickedCustom = customName ? titleCaseName(customName) : "";
    setRamoId(ramo.id);
    setRamoName(pickedCustom || ramo.name);
    setRamoSlug(ramo.slug);
    setCustomRamoName(pickedCustom);
    setRamoQuery("");
    setDescription("");
    setEditingDescription(false);
    setError("");
  }

  function validateCurrentStep() {
    if (active.key === "name" && name.trim().length < 2) return "Informe o nome da empresa.";
    if (active.key === "whatsapp" && whatsapp.replace(/\D/g, "").length < 10) {
      return "Informe um WhatsApp válido.";
    }
    if (active.key === "location" && !stateId) return "Escolha o estado.";
    if (active.key === "ramo" && !ramoId) return "Escolha o ramo.";
    if (active.key === "description" && editingDescription && normalizeCustomDescription(description) === "") {
      return "Escreva uma apresentação um pouco maior.";
    }
    return "";
  }

  function goNext() {
    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    if (active.key === "description") {
      void save();
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleEnter(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (event.key !== "Enter" || event.shiftKey || active.key === "description") return;
    event.preventDefault();
    goNext();
  }

  async function save() {
    setError("");
    setLoading(true);

    const payload = {
      name,
      whatsapp,
      businessCategoryId: ramoId,
      customRamoName,
      stateId,
      cityName,
      servesRegion,
      description: currentDescription,
    };

    const normalized = normalizeOnboardingPayload(payload);
    if ("error" in normalized) {
      setError(String(normalized.error));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; next?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      setDone(true);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[420px] flex-col justify-center py-8 text-center">
        <p className="text-sm font-semibold text-ok">Tudo pronto!</p>
        <h2 className="mt-2 text-2xl font-semibold text-text">Sua empresa já pode criar orçamentos.</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-text-soft">
          Os dados foram salvos e você já pode montar o primeiro orçamento profissional.
        </p>
        <Link
          href="/painel/orcamentos/novo"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-btn bg-gold px-5 text-base font-semibold text-ink hover:bg-gold-press"
        >
          Criar meu primeiro orçamento
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[500px] flex-col">
      <div className="flex items-center gap-2" aria-label={`Etapa ${step + 1} de ${STEPS.length}`}>
        {STEPS.map((item, index) => (
          <span
            key={item.key}
            className={`h-2 flex-1 rounded-full ${index <= step ? "bg-ink" : "bg-paper-alt"}`}
            title={item.label}
          />
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {compactAnswers().map((answer) => (
          <p key={answer} className="truncate rounded-btn bg-paper px-3 py-2 text-sm text-text-soft">
            ✓ {answer}
          </p>
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center py-6">
        {active.key === "name" ? (
          <label>
            <span className="block text-2xl font-semibold text-text">Como se chama sua empresa?</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={handleEnter}
              placeholder="João Elétrica"
              autoFocus
              className="mt-5 w-full rounded-btn border border-line bg-card px-4 py-4 text-base"
            />
          </label>
        ) : null}

        {active.key === "whatsapp" ? (
          <label>
            <span className="block text-2xl font-semibold text-text">
              Qual WhatsApp você usa com seus clientes?
            </span>
            <input
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              onKeyDown={handleEnter}
              inputMode="tel"
              autoComplete="tel"
              placeholder="(16) 99999-9999"
              className="mt-5 w-full rounded-btn border border-line bg-card px-4 py-4 text-base"
            />
          </label>
        ) : null}

        {active.key === "location" ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-text">Onde você trabalha?</h2>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">Estado</span>
              <select
                value={stateId}
                onChange={(event) => {
                  setStateId(event.target.value);
                  setCityName("");
                  setCities([]);
                }}
                onKeyDown={handleEnter}
                className="w-full rounded-btn border border-line bg-card px-4 py-4 text-base"
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
                onKeyDown={handleEnter}
                list="onboarding-cities"
                disabled={!stateId}
                placeholder={stateId ? "Ex.: Barrinha" : "Escolha o estado primeiro"}
                className="w-full rounded-btn border border-line bg-card px-4 py-4 text-base disabled:opacity-50"
              />
              <datalist id="onboarding-cities">
                {cities.map((city) => (
                  <option key={city.id} value={city.name} />
                ))}
              </datalist>
              <p className="mt-1.5 text-xs text-text-soft">Pode deixar em branco se atender vários lugares.</p>
            </label>
          </div>
        ) : null}

        {active.key === "region" ? (
          <div>
            <h2 className="text-2xl font-semibold text-text">Você atende cidades da região também?</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[true, false].map((option) => (
                <button
                  key={String(option)}
                  type="button"
                  onClick={() => {
                    setServesRegion(option);
                    setTimeout(() => setStep(4), 120);
                  }}
                  className={`min-h-16 rounded-btn border px-4 text-base font-semibold ${
                    servesRegion === option
                      ? "border-ink bg-ink text-ink-text"
                      : "border-line bg-card text-text hover:bg-paper"
                  }`}
                >
                  {option ? "Sim" : "Não"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {active.key === "ramo" ? (
          <div>
            <h2 className="text-2xl font-semibold text-text">Qual é o seu ramo?</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {popularRamos.map((ramo) => (
                <button
                  key={ramo.id}
                  type="button"
                  onClick={() => pickRamo(ramo)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-semibold ${
                    ramoId === ramo.id && !customRamoName
                      ? "border-ink bg-ink text-ink-text"
                      : "border-line bg-card text-text"
                  }`}
                >
                  {ramo.name}
                </button>
              ))}
            </div>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-medium text-text">Buscar ou digitar outro ramo</span>
              <input
                value={ramoQuery}
                onChange={(event) => setRamoQuery(event.target.value)}
                onKeyDown={handleEnter}
                placeholder="Ex.: encanador, marceneiro, gesseiro"
                className="w-full rounded-btn border border-line bg-card px-4 py-4 text-base"
              />
            </label>
            <div className="mt-3 max-h-56 overflow-auto rounded-btn border border-line">
              {listedRamos.map((ramo) => (
                <button
                  key={ramo.id}
                  type="button"
                  onClick={() => pickRamo(ramo)}
                  className="block w-full border-b border-line px-4 py-3 text-left text-sm text-text last:border-b-0 hover:bg-paper"
                >
                  {ramo.name}
                </button>
              ))}
              {outro && ramoQuery.trim().length >= 2 ? (
                <button
                  type="button"
                  onClick={() => pickRamo(outro, ramoQuery)}
                  className="block w-full px-4 py-3 text-left text-sm font-semibold text-text hover:bg-paper"
                >
                  Usar “{titleCaseName(ramoQuery)}” como meu ramo
                </button>
              ) : null}
            </div>
            {ramoName ? <p className="mt-3 text-sm text-text-soft">Selecionado: {ramoName}</p> : null}
          </div>
        ) : null}

        {active.key === "description" ? (
          <div>
            <h2 className="text-2xl font-semibold text-text">Montei uma apresentação para você.</h2>
            <div className="mt-5 rounded-box border border-line bg-paper p-4">
              {editingDescription ? (
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Conte em uma frase o que sua empresa faz."
                  rows={4}
                  className="w-full resize-none rounded-btn border border-line bg-card px-4 py-3 text-base leading-6"
                />
              ) : (
                <p className="text-lg font-medium leading-7 text-text">“{currentDescription}”</p>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setDescription(suggestedDescription);
                  setEditingDescription(false);
                }}
                className="min-h-12 rounded-btn border border-line bg-card px-4 font-semibold text-text"
              >
                Está ótimo
              </button>
              <button
                type="button"
                onClick={() => {
                  setDescription(currentDescription);
                  setEditingDescription(true);
                }}
                className="min-h-12 rounded-btn border border-line bg-card px-4 font-semibold text-text"
              >
                Quero alterar
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm font-medium text-no">{error}</p> : null}
      </div>

      <div className="flex gap-3 border-t border-line pt-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={loading}
            className="min-h-12 flex-1 rounded-btn border border-line bg-card px-4 text-base font-semibold text-text disabled:opacity-60"
          >
            Voltar
          </button>
        ) : null}
        <button
          type="button"
          onClick={goNext}
          disabled={loading}
          className="min-h-12 flex-[2] rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
        >
          {loading ? "Salvando…" : active.key === "description" ? "Finalizar" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
