"use client";

import { FormEvent, useState } from "react";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível enviar o link agora.");
        return;
      }
      setMessage(data.message ?? "Se houver uma conta com esse endereço, você receberá um link para redefinir sua senha.");
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {message ? (
        <div className="rounded-btn bg-gold-wash p-4 text-sm text-text">
          <h2 className="text-lg font-semibold">Confira seu e-mail</h2>
          <p className="mt-2 text-text-soft">{message}</p>
        </div>
      ) : null}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">E-mail</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seuemail@gmail.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base text-text"
        />
      </label>
      {error ? <p className="text-sm text-no">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar link"}
      </button>
    </form>
  );
}
