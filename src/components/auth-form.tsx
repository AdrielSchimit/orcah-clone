"use client";

import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "cadastro" | "login" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const url = mode === "cadastro" ? "/api/auth/register" : "/api/auth/login";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; next?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível continuar.");
        setLoading(false);
        return;
      }
      window.location.assign(data.next ?? "/painel");
    } catch {
      setError("Falha de conexão. Tente de novo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
      {mode === "cadastro" ? (
        <>
          <Field name="name" label="Seu nome" placeholder="João da Silva" required />
          <Field name="phone" label="Telefone" placeholder="49 99999-0000" />
        </>
      ) : null}
      <Field name="email" label="E-mail" type="email" placeholder="voce@email.com" required />
      <Field
        name="password"
        label="Senha"
        type="password"
        placeholder={mode === "cadastro" ? "Mínimo 6 caracteres" : "Sua senha"}
        required
      />
      {error ? <p className="text-sm text-no">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Aguarde…" : mode === "cadastro" ? "Criar conta" : "Entrar"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base text-text"
      />
    </label>
  );
}
