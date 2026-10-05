"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { TRIAL_DAYS } from "@/lib/plan-constants";
import { appUrl, companyPublicUrl } from "@/lib/urls";
import styles from "./home-commercial-hero.module.css";

type IconName = "person" | "search" | "arrow" | "pin" | "check" | "calendar" | "card" | "page" | "star" | "bolt" | "paint" | "bricks" | "water" | "snow" | "house" | "tool" | "more";
const benefits = ["Página com sua logo, fotos e serviços", "Receba clientes da sua região", "Orçamentos prontos para enviar", "Compartilhe no WhatsApp, Instagram e mais"];
const categories: { label: string; query: string; icon: IconName }[] = [
  { label: "Eletricista", query: "eletricista", icon: "bolt" },
  { label: "Pintor", query: "pintor", icon: "paint" },
  { label: "Pedreiro", query: "pedreiro", icon: "bricks" },
  { label: "Encanador", query: "encanador", icon: "water" },
  { label: "Ar-condicionado", query: "ar-condicionado", icon: "snow" },
  { label: "Limpeza", query: "limpeza", icon: "house" },
  { label: "Marido de aluguel", query: "marido de aluguel", icon: "tool" },
  { label: "Ver mais", query: "", icon: "more" },
];
const audiences = [
  ["professional", "Sou profissional", "Divulgar e receber clientes", "person"],
  ["customer", "Preciso de um profissional", "Encontrar e pedir orçamentos", "search"],
] as const;

export function HomeCommercialHero() {
  const [active, setActive] = useState(0);
  const [location, setLocation] = useState("");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - active;
    setActive(next);
    tabs.current[next]?.focus();
  }
  function categoryHref(query: string) {
    const params = new URLSearchParams();
    if (query) params.set("servico", query);
    if (location.trim()) params.set("local", location.trim());
    return "/prestadores" + (params.size ? "?" + params.toString() : "");
  }

  return (
    <section id="hero-comercial" className={styles.hero} data-audience={audiences[active][0]} aria-label="Orçah para profissionais e clientes">
      <div className={styles.stage}>
        <div className={styles.tabs} role="tablist" aria-label="Como você quer usar o Orçah?">
          {audiences.map(([value, title, subtitle, icon], index) => (
            <button key={value} ref={(element) => { tabs.current[index] = element; }} id={"hero-tab-" + value} type="button" role="tab" aria-selected={active === index} aria-controls={"hero-panel-" + value} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={onTabKey} className={styles.tab}>
              <span className={styles.tabIcon}><Icon name={icon} /></span>
              <span><strong>{title}</strong><small>{subtitle}</small></span>
            </button>
          ))}
        </div>

        <div id="hero-panel-professional" role="tabpanel" aria-labelledby="hero-tab-professional" tabIndex={0} hidden={active !== 0} className={styles.panel}>
          <div className={styles.portrait}>
            <Image src="/home/prestador.webp" alt="Pintor sorrindo em uma reforma, de braços cruzados" fill preload sizes="(min-width: 1200px) 650px, (min-width: 768px) 60vw, 90vw" className={styles.photo} />
          </div>
          <div className={styles.copy}>
            <h1>Sua página<br />profissional.<span>Orçamentos em minutos.</span></h1>
            <p>Crie sua página, mostre seus serviços, receba clientes da sua região e envie orçamentos profissionais.</p>
            <ul className={styles.benefits}>{benefits.map((benefit) => <li key={benefit}><span><Icon name="check" /></span>{benefit}</li>)}</ul>
            <Link href={appUrl("/cadastro")} className={styles.primaryCta}>Criar minha página grátis <Icon name="arrow" /></Link>
            <div className={styles.trial}>
              <span><Icon name="calendar" />{TRIAL_DAYS} dias grátis</span>
              <span><Icon name="card" />Sem cartão<span className={styles.credit}> de crédito</span></span>
              <span><Icon name="check" />Cancele quando quiser</span>
            </div>
          </div>
          <div className={styles.previewWrap}>
            <a className={styles.preview} href={companyPublicUrl("pintura-norte")} aria-label="Ver exemplo da página profissional Pintura Norte">
              <div className={styles.previewHeader}><span><Icon name="page" /></span><div><small>Sua página profissional</small><b>pintura-norte.orcah.com.br</b></div></div>
              <div className={styles.previewCover}><Image src="/demo/trabalho-fachada.webp" alt="Exemplo de trabalho de pintura" fill sizes="280px" /></div>
              <div className={styles.previewAvatar}><Image src="/home/prestador.webp" alt="" fill sizes="56px" /></div>
              <div className={styles.previewDetails}><strong>Pintura Norte</strong><span className={styles.previewStars}>★★★★★ <small>Página de exemplo</small></span><p>Maravilha - SC</p></div>
              <div className={styles.previewNav}><span><Icon name="page" />Serviços</span><span><Icon name="house" />Fotos</span><span><Icon name="star" />Avaliações</span></div>
              <div className={styles.previewServices}>{["Pintura interna", "Massa corrida", "Pintura externa"].map((service, index) => <div key={service}><Image src={index === 1 ? "/demo/trabalho-sala.webp" : "/demo/trabalho-muro.webp"} alt="" width={40} height={40} /><span><b>{service}</b><small>Peça um orçamento</small></span></div>)}</div>
              <div className={styles.previewBottom} />
            </a>
            <div className={styles.growth}><span><Icon name="bolt" /></span><b>Mais visibilidade<br />na sua região</b></div>
            <div className={styles.message}><span><Icon name="page" /></span><b>Pedidos de orçamento<br />direto pelo seu link</b><small>Exemplo</small></div>
          </div>
        </div>

        <div id="hero-panel-customer" role="tabpanel" aria-labelledby="hero-tab-customer" tabIndex={0} hidden={active !== 1} className={styles.panel}>
          <div className={styles.portrait}><Image src="/home/cliente.webp" alt="Cliente no sofá procurando um profissional pelo celular" fill sizes="(min-width: 1200px) 650px, (min-width: 768px) 60vw, 90vw" className={styles.photo} /></div>
          <div className={styles.copy}>
            <h2>Encontre<br />profissionais<span>de confiança.</span></h2>
            <p>Compare, veja fotos de serviços e peça orçamentos de profissionais da sua região em poucos cliques.</p>
          </div>
          <div className={styles.customerActions}>
            <form action="/prestadores" method="get" className={styles.search}>
              <div className={styles.fields}>
                <label className={styles.field}><Icon name="search" /><span><span>Qual serviço você precisa?</span><input name="servico" aria-label="Qual serviço você precisa?" placeholder="Ex: eletricista, pintor, pedreiro..." required /></span></label>
                <label className={styles.field}><Icon name="pin" /><input name="local" aria-label="Sua cidade e estado" placeholder="Sua cidade - UF" value={location} onChange={(event) => setLocation(event.target.value)} required /></label>
              </div>
              <button type="submit" className={styles.searchCta}>Buscar profissionais <Icon name="arrow" /></button>
            </form>
            <div className={styles.categoriesHeader}><h3>Serviços mais buscados</h3><Link href={categoryHref("")}>Ver todos <Icon name="arrow" /></Link></div>
            <div className={styles.categories}>{categories.map(({ label, query, icon }) => <Link key={label} href={categoryHref(query)} className={styles.category}><Icon name={icon} /><span>{label}</span></Link>)}</div>
            <p className={styles.customerFree}>Para clientes, é grátis. Encontre e fale com profissionais.</p>
          </div>
        </div>
      </div>
      <div className={styles.trust}>
        {([
          ["person", "Profissionais da sua região", "Encontre perto de você"],
          ["page", "Orçamentos rápidos", "Contato direto com o profissional"],
          ["pin", "Serviços em um só lugar", "Compare e escolha com calma"],
          ["star", "Conheça os trabalhos", "Veja fotos e informações"],
        ] as const).map(([icon, title, subtitle]) => <div key={title}><span className={styles.trustIcon}><Icon name={icon} /></span><span><strong>{title}</strong><small>{subtitle}</small></span></div>)}
      </div>
    </section>
  );
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    person: <><circle cx="12" cy="7" r="3.5" /><path d="M5 21v-3a7 7 0 0 1 14 0v3Z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h4" /></>,
    page: <><path d="M14 2H5v20h14V7Z" /><path d="M14 2v6h5M8 12h8M8 16h8" /></>,
    star: <path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5L6 21l1-6.5-5-5 7-1Z" />,
    bolt: <path d="m14 2-9 12h7l-2 8 9-13h-7Z" fill="currentColor" strokeWidth="1" />,
    paint: <><rect x="3" y="3" width="15" height="7" rx="2" fill="currentColor" /><path d="M18 6h3v7h-9v3" /><rect x="10" y="16" width="4" height="6" rx="1" fill="currentColor" /></>,
    bricks: <path d="M4 3h7v5H4zm10 0h7v5h-7zM2 11h7v4H2zm10 0h9v4h-9zM2 18h9v4H2zm12 0h7v4h-7z" fill="currentColor" strokeWidth="1" />,
    water: <><path d="M3 11h15a3 3 0 0 1 3 3v3h-5v-2H3Zm7-6h6M13 3v8M6 8v9" /><path d="M19 19s-2 2-2 3h4c0-1-2-3-2-3Z" fill="currentColor" /></>,
    snow: <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1-1-4m12 14-1-4 4-1M3 14l4 1-1 4M18 5l-1 4 4 1" />,
    house: <><path d="m2 11 10-9 10 9M5 9v13h14V9" /><path d="M10 22v-8h4v8" /></>,
    tool: <path d="M21 3a6 6 0 0 1-8 8L5 21a2 2 0 0 1-3-3l10-8a6 6 0 0 1 8-8l-4 4 2 2Z" fill="currentColor" strokeWidth="1" />,
    more: <><circle cx="4" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="20" cy="12" r="1.5" fill="currentColor" /></>,
  };
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
