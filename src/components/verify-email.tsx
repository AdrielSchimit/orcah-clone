"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { PENDING_EMAIL_KEY } from "@/components/auth-form";
import { Mascote } from "@/components/mascote";

function mask(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "";
  return `${user.slice(0, Math.min(2, user.length))}***@${domain}`;
}

function readPending() {
  try {
    return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

const buttonClass =
  "flex min-h-12 w-full items-center justify-center rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60";

function ResendBox({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const response = await fetch("/api/auth/verificar-email/reenviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => ({}))) as { message?: string; error?: string } | undefined;
    setLoading(false);
    if (!response?.ok) {
      setError(data?.error ?? "Não foi possível reenviar agora.");
      return;
    }
    setMessage(data?.message ?? "Se houver uma conta aguardando confirmação, enviamos um novo link.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
      {initialEmail ? null : (
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-label="Seu e-mail"
          placeholder="Seu e-mail"
          className="w-full rounded-btn border border-line bg-card px-4 py-3 text-base text-text"
        />
      )}
      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? "Enviando…" : "Reenviar e-mail"}
      </button>
      {message ? <p className="text-sm text-ok">{message}</p> : null}
      {error ? <p className="text-sm text-no">{error}</p> : null}
    </form>
  );
}

/** Sem token: "Confira seu e-mail". Com token: confirma (POST) e segue para o onboarding. */
export function VerifyEmail({ token, sendFailed }: { token: string; sendFailed: boolean }) {
  const [pending, setPending] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "checking" | "ok" | "error">(token ? "checking" : "idle");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // sessionStorage só existe no navegador
    queueMicrotask(() => setPending(readPending()));
  }, []);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    void (async () => {
      const response = await fetch("/api/auth/verificar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => null);
      const data = (await response?.json().catch(() => ({}))) as { next?: string; error?: string } | undefined;
      if (!response?.ok) {
        setError(data?.error ?? "Não foi possível confirmar agora.");
        setState("error");
        return;
      }
      try {
        sessionStorage.removeItem(PENDING_EMAIL_KEY);
      } catch {
        // tudo bem
      }
      setState("ok");
      window.setTimeout(() => window.location.assign(data?.next ?? "/onboarding"), 900);
    })();
  }, [token]);

  if (token) {
    return (
      <div className="rounded-box border border-line bg-card p-5 shadow-card">
        {state === "checking" ? (
          <>
            <h1 className="text-2xl font-semibold">Confirmando seu e-mail…</h1>
            <p className="mt-2 text-sm text-text-soft">Só um instante.</p>
          </>
        ) : state === "ok" ? (
          <>
            <Mascote pose="sucesso" className="mx-auto mb-2 h-28 w-auto" priority />
            <h1 className="text-center text-2xl font-semibold">E-mail confirmado ✓</h1>
            <p className="mt-2 text-center text-sm text-text-soft">Levando você para montar sua empresa…</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">{error}</h1>
            <p className="mt-2 text-sm text-text-soft">Peça um novo link de confirmação.</p>
            <ResendBox initialEmail={pending ?? ""} />
            <Link href="/login" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-gold-deep">
              Já confirmei, quero entrar
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-box border border-line bg-card p-5 shadow-card">
      <Mascote pose="explicando" className="mx-auto mb-2 h-28 w-auto" priority />
      <h1 className="text-center text-2xl font-semibold">Confira seu e-mail</h1>
      {sendFailed ? (
        <p className="mt-2 text-sm text-no">Não foi possível enviar o e-mail agora. Tente reenviar em instantes.</p>
      ) : pending ? (
        <p className="mt-2 text-sm text-text-soft">
          Enviamos um link para: <span className="font-semibold text-text">{mask(pending)}</span>
        </p>
      ) : (
        <p className="mt-2 text-sm text-text-soft">Enviamos um link de confirmação para o seu e-mail.</p>
      )}
      <p className="mt-2 text-sm text-text-soft">
        Abra o e-mail e toque em <span className="whitespace-nowrap">“Confirmar meu e-mail”</span>. O link vale por 30
        minutos. Não achou? Olhe também o spam.
      </p>
      {pending === null ? null : <ResendBox initialEmail={pending} />}
      <Link href="/login" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-gold-deep">
        Voltar ao login
      </Link>
    </div>
  );
}
