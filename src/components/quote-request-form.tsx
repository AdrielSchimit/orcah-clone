"use client";

import { FormEvent, useEffect, useState } from "react";
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
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-box bg-ok-wash p-4 text-center font-medium text-ok">
        Pedido enviado. A empresa entra em contato pelo WhatsApp.
      </p>
    );
  }

  return (
    <form id="pedir" onSubmit={onSubmit} className="flex flex-col gap-3 rounded-box border border-line bg-card p-4">
      <h2 className="text-lg font-semibold">Precisa de um orçamento?</h2>
      <p className="text-sm text-text-soft">Preencha e entraremos em contato.</p>
      <input
        name="customerName"
        required
        placeholder="Seu nome"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="customerPhone"
        required
        placeholder="WhatsApp"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="desiredService"
        placeholder="Serviço desejado"
        defaultValue={defaultService}
        list={services.length > 0 ? "servicos-da-empresa" : undefined}
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      {services.length > 0 ? (
        <datalist id="servicos-da-empresa">
          {services.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      ) : null}
      <textarea
        name="description"
        rows={3}
        placeholder="Descreva o que precisa"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <select
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
      <input
        value={cityName}
        onChange={(event) => setCityName(event.target.value)}
        onBlur={() => setCityName((current) => titleCaseName(current))}
        disabled={!stateId}
        placeholder={stateId ? "Cidade (opcional)" : "Escolha o estado para informar a cidade"}
        className="rounded-btn border border-line bg-card px-4 py-3 disabled:opacity-50"
      />
      <input
        name="neighborhood"
        placeholder="Bairro"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="preferredTime"
        placeholder="Melhor horário para contato"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      {error ? <p className="text-sm text-no">{error}</p> : null}
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
