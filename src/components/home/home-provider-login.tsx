"use client";

import { useRef } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { appUrl } from "@/lib/urls";
import styles from "./home-provider-login.module.css";

export const HOME_LOGIN_ID = "home-provider-login";

export function HomeProviderLogin() {
  const panel = useRef<HTMLDivElement>(null);

  return (
    <div ref={panel} id={HOME_LOGIN_ID} popover="auto" role="dialog" aria-labelledby="home-login-title" className={styles.panel} onToggle={(event) => {
      if (event.newState === "open") panel.current?.querySelector<HTMLInputElement>("input")?.focus();
    }}>
      <button type="button" popoverTarget={HOME_LOGIN_ID} popoverTargetAction="hide" aria-label="Fechar login" className={styles.close}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
      </span>
      <h2 id="home-login-title">Área do prestador</h2>
      <p className={styles.intro}>Entre para acompanhar sua página, seus clientes e orçamentos.</p>
      <div className={styles.form}><AuthForm mode="login" /></div>
      <Link href={appUrl("/recuperar-senha")} className={styles.recover}>Esqueci minha senha</Link>
      <div className={styles.footer}>Ainda não tem conta? <Link href={appUrl("/cadastro")}>Começar grátis <span aria-hidden="true">→</span></Link></div>
    </div>
  );
}
