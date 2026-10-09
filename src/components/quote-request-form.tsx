"use client";

import { FormEvent, useEffect, useState } from "react";
import { PhoneInput } from "@/components/phone-input";
import { titleCaseName } from "@/lib/text";

type State = { id: number; name: string; uf: string };

export function QuoteRequestForm({
  slug,
  defaultService = "",
  services = [],
}: {
  slug: string;
  defaultService?: string;
  services?: string[];
}) {
  const [states, setStates] = useState<State[]>([]);
  const [stateId, setStateId] = useState("");
  const [cityName, setCityName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
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
      const response = await fetch(`/api/publico/empresas/${slug}/pedir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          customerPhone: form.get("customerPhone"),
          desiredService: form.get("desiredService"),
          description: form.get("description"),
          neighborhood: form.get("neighborhood"),
          preferredTime: form.get("preferredTime"),
          stateId: stateId || undefined,
          cityName,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível enviar.");
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
      <p id="pedir" role="status" className="rounded-box bg-ok-wash p-4 text-center font-medium text-ok">
        Pedido enviado. A empresa entra em contato pelo WhatsApp.
      </p>
    );
  }

  return (
    <form id="pedir" onSubmit={onSubmit} className="provider-quote-form flex flex-col gap-3 rounded-box border border-line bg-card p-4">
      <h2 className="text-lg font-semibold">Precisa de um orçamento?</h2>
      <p className="text-sm text-text-soft">Conte o que precisa. O prestador responde pelo seu WhatsApp.</p>
      <div className="provider-form-fields">
      <div className="provider-field">
      <label htmlFor="quote-customerName">Seu nome *</label>
      <input
        id="quote-customerName"
        name="customerName"
        required
        aria-label="Seu nome"
        placeholder="Seu nome"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      </div>
      <div className="provider-field">
      <label htmlFor="quote-customerPhone">WhatsApp *</label>
      <PhoneInput
        id="quote-customerPhone"
        name="customerPhone"
        required
        ariaLabel="WhatsApp"
        placeholder="(49) 9 9999-0000"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      </div>
      <div className="provider-field provider-field-wide">
      <label htmlFor="quote-desiredService">Serviço desejado</label>
      <input
        id="quote-desiredService"
        name="desiredService"
        aria-label="Serviço desejado"
        placeholder="Serviço desejado"
        defaultValue={defaultService}
        list={services.length > 0 ? "servicos-da-empresa" : undefined}
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      </div>
      {services.length > 0 ? (
        <datalist id="servicos-da-empresa">
          {services.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      ) : null}
      <div className="provider-field provider-field-wide">
      <label htmlFor="quote-description">Descreva o que precisa</label>
      <textarea
        id="quote-description"
        name="description"
        rows={3}
        aria-label="Descreva o que precisa"
        placeholder="Descreva o que precisa"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      </div>
      <div className="provider-field">
      <label htmlFor="quote-state">Estado (opcional)</label>
      <select
        id="quote-state"
        aria-label="Estado"
        value={stateId}
        onChange={(event) => setStateId(event.target.value)}
        className="rounded-btn border border-line bg-card px-4 py-3"
      >
        <option value="">Estado (opcional)</option>
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name} ({state.uf})
          </option>
        ))}
      </select>
      </div>
      <div className="provider-field">
      <label htmlFor="quote-city">Cidade (opcional)</label>
      <input
        id="quote-city"
        value={cityName}
        onChange={(event) => setCityName(event.target.value)}
        onBlur={() => setCityName((current) => titleCaseName(current))}
        disabled={!stateId}
        aria-label="Cidade"
        placeholder={stateId ? "Cidade (opcional)" : "Escolha o estado para informar a cidade"}
        className="rounded-btn border border-line bg-card px-4 py-3 disabled:opacity-50"
      />
      </div>
      <div className="provider-field">
      <label htmlFor="quote-neighborhood">Bairro (opcional)</label>
      <input
        id="quote-neighborhood"
        name="neighborhood"
        aria-label="Bairro"
        placeholder="Bairro"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      </div>
      <div className="provider-field">
      <label htmlFor="quote-preferredTime">Melhor horário para contato (opcional)</label>
      <input
        id="quote-preferredTime"
        name="preferredTime"
        aria-label="Melhor horário para contato"
        placeholder="Melhor horário para contato"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      </div>
      </div>
      <p className="text-xs text-text-soft">* Campos obrigatórios</p>
      {error ? <p role="alert" className="text-sm text-no">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="min-h-12 rounded-btn bg-gold px-4 font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Solicitar orçamento"}
      </button>
    </form>
  );
}
