"use client";

import { FormEvent, useEffect, useState } from "react";
import { PhoneInput } from "@/components/phone-input";
import { titleCaseName } from "@/lib/text";
import { quoteRequestPayload, sendQuoteRequest } from "@/lib/quote-request";

type State = { id: number; name: string; uf: string };

export function QuoteRequestForm({
  slug,
  defaultService = "",
  services = [],
  submitClassName = "bg-gold hover:bg-gold-press",
  inDialog = false,
}: {
  slug: string;
  defaultService?: string;
  services?: string[];
  submitClassName?: string;
  inDialog?: boolean;
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
      .then((data: State[]) => setStates(Array.isArray(data) ? data : []))
      .catch(() => setStates([]));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      await sendQuoteRequest(slug, quoteRequestPayload(form, stateId, cityName));
      setDone(true);
    } catch (cause) {
      setError(cause instanceof TypeError ? "Falha de conexão. Tente de novo." : cause instanceof Error ? cause.message : "Não foi possível enviar.");
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
    <form onSubmit={onSubmit} className={`provider-quote-form ${inDialog ? "" : "rounded-box border border-line bg-card"}`}>
      {!inDialog ? <h2 className="text-lg font-semibold">Solicitar orçamento</h2> : null}
      <p className="provider-form-intro">Conte o que precisa. O prestador responde pelo seu WhatsApp.</p>
      {defaultService ? <p className="provider-selected-service">Serviço: <strong>{defaultService}</strong></p> : null}
      <div className="provider-form-fields">
        <div className="provider-field">
          <label htmlFor="quote-customerName">Seu nome *</label>
          <input id="quote-customerName" name="customerName" required minLength={2} maxLength={160} autoComplete="name" placeholder="Seu nome" />
        </div>
        <div className="provider-field">
          <label htmlFor="quote-customerPhone">WhatsApp *</label>
          <PhoneInput id="quote-customerPhone" name="customerPhone" required ariaLabel="WhatsApp" placeholder="(49) 9 9999-0000" />
        </div>
        <div className="provider-field provider-field-wide">
          <label htmlFor="quote-description">O que você precisa?</label>
          <textarea id="quote-description" name="description" rows={3} placeholder="Conte um pouco sobre o serviço que procura" />
        </div>
      </div>
      <details className="provider-extra-details">
        <summary>Adicionar mais detalhes</summary>
        <div className="provider-form-fields">
          <div className="provider-field provider-field-wide">
            <label htmlFor="quote-desiredService">Serviço desejado (opcional)</label>
            <input id="quote-desiredService" name="desiredService" defaultValue={defaultService} list={services.length ? "servicos-da-empresa" : undefined} placeholder="Escolha ou informe um serviço" />
            {services.length ? <datalist id="servicos-da-empresa">{services.map((name) => <option key={name} value={name} />)}</datalist> : null}
          </div>
          <div className="provider-field">
            <label htmlFor="quote-state">Estado (opcional)</label>
            <select id="quote-state" value={stateId} onChange={(event) => { setStateId(event.target.value); setCityName(""); }}>
              <option value="">Escolha o estado</option>
              {states.map((state) => <option key={state.id} value={state.id}>{state.name} ({state.uf})</option>)}
            </select>
          </div>
          <div className="provider-field">
            <label htmlFor="quote-city">Cidade (opcional)</label>
            <input id="quote-city" value={cityName} onChange={(event) => setCityName(event.target.value)} onBlur={() => setCityName((current) => titleCaseName(current))} disabled={!stateId} placeholder={stateId ? "Sua cidade" : "Escolha o estado primeiro"} />
          </div>
          <div className="provider-field">
            <label htmlFor="quote-neighborhood">Bairro (opcional)</label>
            <input id="quote-neighborhood" name="neighborhood" placeholder="Seu bairro" />
          </div>
          <div className="provider-field">
            <label htmlFor="quote-preferredTime">Melhor horário (opcional)</label>
            <input id="quote-preferredTime" name="preferredTime" placeholder="Quando podemos falar?" />
          </div>
        </div>
      </details>
      <p className="provider-required-note">* Campos obrigatórios</p>
      {error ? <p role="alert" className="text-sm text-no">{error}</p> : null}
      <button type="submit" disabled={loading} className={"provider-button provider-submit " + submitClassName}>{loading ? "Enviando…" : "Solicitar orçamento"}</button>
    </form>
  );
}
