import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { OrcahLogo } from "@/components/orcah-logo";
import { PLAN_PRICE_LABEL, TRIAL_DAYS } from "@/lib/plan-constants";
import { appUrl } from "@/lib/urls";
import styles from "./cadastro.module.css";

export const metadata: Metadata = {
  title: "Começar grátis",
  description: "Crie sua conta no Orçah, monte sua página profissional e envie orçamentos. Teste por 7 dias, sem cartão.",
};

export default function CadastroPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={appUrl("/")} aria-label="Orçah — início"><OrcahLogo priority className={styles.logo} /></Link>
        <Link href={appUrl("/login")} className={styles.loginLink}><span>Já tem conta?</span> Entrar <Arrow /></Link>
      </header>
      <main className={styles.layout}>
        <section className={styles.story} aria-labelledby="cadastro-intro">
          <div className={styles.storyCopy}>
            <span className={styles.eyebrow}><span />Para quem vive de serviço</span>
            <h1 id="cadastro-intro">Seu trabalho merece<br />o próximo <span>“fechado”.</span></h1>
            <p>Mostre o que você faz, receba novos clientes e transforme pedidos em orçamentos profissionais.</p>
          </div>
          <div className={styles.photo}>
            <Image src="/home/acordo-fechado.webp" alt="Prestador e cliente apertando as mãos depois de fechar um serviço de reforma" fill preload sizes="(min-width: 1100px) 650px, (min-width: 900px) 55vw, 100vw" />
          </div>
          <div className={styles.photoCaption}>
              <span className={styles.captionIcon}><Check /></span>
              <span><strong>Do primeiro contato ao serviço fechado.</strong><small>Sua página. Seus orçamentos. Seus clientes.</small></span>
          </div>
          <ul className={styles.benefits}>
            <li><Check />Sua página com fotos e serviços</li>
            <li><Check />Orçamentos prontos para enviar</li>
            <li><Check />Seu link no WhatsApp e no Instagram</li>
          </ul>
        </section>
        <section className={styles.formColumn} aria-labelledby="cadastro-titulo">
          <div className={styles.formCard}>
            <span className={styles.trialBadge}><Gift />{TRIAL_DAYS} dias grátis para começar</span>
            <h2 id="cadastro-titulo">Vamos criar sua conta?</h2>
            <p className={styles.formIntro}>É rápido. Depois, você personaliza sua página e escolhe seu ramo.</p>
            <div className={styles.form}><AuthForm mode="cadastro" /></div>
            <p className={styles.price}>Sem cartão de crédito. Depois do teste, {PLAN_PRICE_LABEL}.<br />Cancele quando quiser.</p>
            <div className={styles.loginFooter}>Já tem uma conta? <Link href={appUrl("/login")}>Entrar no Orçah <Arrow /></Link></div>
          </div>
          <p className={styles.note}><Check />Tudo começa com o seu próximo passo.</p>
        </section>
      </main>
    </div>
  );
}

function Arrow() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}

function Check() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function Gift() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3Zm0 0h4a3 3 0 1 0-3-3Z" /></svg>;
}
