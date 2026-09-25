"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export function PasswordResetConfirmForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível alterar a senha.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-box border border-line bg-card p-5 shadow-card">
        <h1 className="text-2xl font-semibold">Senha alterada com sucesso.</h1>
        <p className="mt-3 text-sm leading-6 text-text-soft">Entre novamente usando sua nova senha.</p>
        <Link
          href="/login"
          className="mt-5 flex min-h-12 items-center justify-center rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press"
        >
          Entrar no Orçah
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-box border border-line bg-card p-4 shadow-card">
      <h1 className="text-2xl font-semibold">Crie sua nova senha</h1>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">Nova senha</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base text-text"
        />
      </label>
      {error ? <p className="text-sm text-no">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
