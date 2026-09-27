"use client";

import { FormEvent, useState } from "react";
import { PasswordChecklist } from "@/components/password-checklist";
import { passwordIsStrong } from "@/lib/password-rules";

export const PENDING_EMAIL_KEY = "orcah-verificar-email";

export function AuthForm({ mode }: { mode: "cadastro" | "login" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUnverifiedEmail("");
    setResendMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;

    if (mode === "cadastro" && !passwordIsStrong(password)) {
      setError("A senha ainda não cumpre todos os itens abaixo.");
      return;
    }

    setLoading(true);
    const url = mode === "cadastro" ? "/api/auth/register" : "/api/auth/login";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; next?: string; code?: string; emailSent?: boolean };
      if (!response.ok) {
        if (data.code === "email_not_verified") setUnverifiedEmail(String(payload.email ?? ""));
        setError(data.error ?? "Não foi possível continuar.");
        setLoading(false);
        return;
      }
      if (mode === "cadastro") {
        try {
          sessionStorage.setItem(PENDING_EMAIL_KEY, String(payload.email ?? "").trim().toLowerCase());
        } catch {
          // sem sessionStorage a tela pede o e-mail para reenviar
        }
      }
      const next = data.next ?? "/painel";
      window.location.assign(mode === "cadastro" && data.emailSent === false ? `${next}?envio=falhou` : next);
    } catch {
      setError("Falha de conexão. Tente de novo.");
      setLoading(false);
    }
  }

  async function resend() {
    setResendMessage("");
    const response = await fetch("/api/auth/verificar-email/reenviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => ({}))) as { message?: string; error?: string } | undefined;
    setResendMessage(data?.message ?? data?.error ?? "Não foi possível reenviar agora.");
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
      {mode === "cadastro" ? (
        <>
          <Field name="name" label="Seu nome" placeholder="João da Silva" autoComplete="name" required />
          <Field name="phone" label="Telefone" placeholder="49 99999-0000" autoComplete="tel" inputMode="tel" />
        </>
      ) : null}
      <Field
        name="email"
        label="E-mail"
        type="email"
        placeholder="voce@email.com"
        autoComplete="email"
        inputMode="email"
        required
      />
      <div>
        <Field
          name="password"
          label="Senha"
          type="password"
          placeholder={mode === "cadastro" ? "Crie uma senha forte" : "Sua senha"}
          autoComplete={mode === "cadastro" ? "new-password" : "current-password"}
          value={mode === "cadastro" ? password : undefined}
          onChange={mode === "cadastro" ? setPassword : undefined}
          required
        />
        {mode === "cadastro" ? (
          <div className="mt-2">
            <PasswordChecklist password={password} />
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-no">{error}</p> : null}
      {unverifiedEmail ? (
        <div className="rounded-btn bg-gold-wash p-3 text-sm">
          <button type="button" onClick={() => void resend()} className="min-h-11 font-semibold text-gold-deep underline underline-offset-4">
            Reenviar e-mail de confirmação
          </button>
          {resendMessage ? <p className="mt-1 text-text-soft">{resendMessage}</p> : null}
        </div>
      ) : null}
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
  autoComplete,
  inputMode,
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "email" | "tel" | "text";
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        {...(onChange ? { value: value ?? "", onChange: (event) => onChange(event.target.value) } : {})}
        className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base text-text"
      />
    </label>
  );
}
