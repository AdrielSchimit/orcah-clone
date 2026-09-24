"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type State = { id: number; name: string; uf: string };
type City = { id: number; name: string };

const fieldClass = "w-full rounded-btn border border-line px-4 py-3";

export function CustomerForm() {
  const router = useRouter();
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/localidades/estados")
      .then((response) => response.json())
      .then(setStates);
  }, []);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      setCityId("");
      return;
    }
    fetch(`/api/localidades/cidades?stateId=${stateId}`)
      .then((response) => response.json())
      .then((data: City[]) => {
        setCities(data);
        setCityId("");
      });
  }, [stateId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          whatsapp: data.get("whatsapp"),
          email: data.get("email"),
          address: data.get("address"),
          neighborhood: data.get("neighborhood"),
          notes: data.get("notes"),
          stateId: stateId || undefined,
          cityId: cityId || undefined,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Não foi possível salvar.");
        return;
      }
      form.reset();
      setStateId("");
      setCityId("");
      setMore(false);
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-box border border-line bg-card p-4">
      <h2 className="text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Novo cliente</h2>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Nome</span>
        <input name="name" required placeholder="Maria Souza" className={fieldClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Telefone</span>
        <input name="phone" required placeholder="49 99999-0000" className={fieldClass} />
      </label>
      <button
        type="button"
        onClick={() => setMore((value) => !value)}
        className="text-left text-sm font-medium text-gold-deep"
      >
        {more ? "Menos dados" : "Mais dados"}
      </button>
      {more ? (
        <>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">WhatsApp (se diferente)</span>
            <input name="whatsapp" placeholder="49 99999-0000" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">E-mail</span>
            <input name="email" type="email" placeholder="henry.w@example.net" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Estado</span>
            <select
              value={stateId}
              onChange={(event) => setStateId(event.target.value)}
              className={fieldClass}
            >
              <option value="">Opcional</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name} ({state.uf})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Cidade</span>
            <select
              value={cityId}
              onChange={(event) => setCityId(event.target.value)}
              disabled={!stateId}
              className={`${fieldClass} disabled:opacity-50`}
            >
              <option value="">{stateId ? "Cidade" : "Escolha o estado"}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Bairro</span>
            <input name="neighborhood" placeholder="Centro" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Endereço</span>
            <input name="address" placeholder="Rua, número" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Observações</span>
            <textarea name="notes" rows={2} placeholder="Como prefere ser chamado…" className={fieldClass} />
          </label>
        </>
      ) : null}
      {error ? <p className="text-sm text-no">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="min-h-12 rounded-btn bg-gold px-4 font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Cadastrar cliente"}
      </button>
    </form>
  );
}
