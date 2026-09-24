"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { WhatsAppGlyph } from "./hero-quote-demo";
import { useInView, usePrefersReducedMotion } from "./motion";
import { PhoneFrame } from "./phone-frame";

const STEP_MS = 4200;

const steps = [
  { kicker: "Mostrar", title: "Monte sua página", text: "Nome, serviços e as melhores fotos. Dá para fazer na hora do almoço." },
  { kicker: "Receber", title: "Coloque o link na bio", text: "O cliente vê seu trabalho e pede orçamento ali mesmo." },
  { kicker: "Orçar", title: "Monte e mande no Zap", text: "Escolha os itens do seu ramo, ponha o preço e toque em enviar." },
  { kicker: "Acompanhar", title: "Veja a resposta", text: "Abriu, aprovou ou pediu mudança: você fica sabendo na hora." },
];

export function FlowSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const auto = inView && !paused && !reduced;

  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(() => setActive((current) => (current + 1) % steps.length), STEP_MS);
    return () => clearTimeout(id);
  }, [auto, active]);

  return (
    <section id="como-funciona" className="scroll-mt-24 bg-paper-alt px-4 py-16 md:py-24">
      <div ref={ref} className="mx-auto w-full max-w-5xl">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Como funciona</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-4xl md:leading-tight">Do Instagram ao “pode fazer”.</h2>
          <p className="mt-2 text-text-soft">Quatro passos. Tudo no celular.</p>
        </div>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {steps.map((step, index) => {
              const on = index === active;
              return (
                <li key={step.title}>
                  <button
                    type="button"
                    onClick={() => {
                      setPaused(true);
                      setActive(index);
                    }}
                    aria-current={on ? "step" : undefined}
                    className={`relative w-full overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 ease-soft ${
                      on ? "bg-card shadow-card" : "bg-transparent hover:bg-card/60"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ${
                          on || index < active ? "bg-gold text-ink" : "border border-line bg-card text-text-soft"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-[11px] font-medium uppercase tracking-[0.04em] text-gold-deep">{step.kicker}</span>
                        <span className={`block font-semibold ${on ? "text-text" : "text-text-soft"}`}>{step.title}</span>
                      </span>
                    </span>
                    <span
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-soft ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <span className="overflow-hidden">
                        <span className="block pl-11 pt-2 text-sm text-text-soft">{step.text}</span>
                      </span>
                    </span>
                    {on ? (
                      <span aria-hidden className="absolute inset-x-4 bottom-0 h-0.5 overflow-hidden rounded-full bg-line">
                        <span
                          key={`${active}-${auto}`}
                          className={`block h-full origin-left bg-gold ${auto ? "animate-progress" : ""}`}
                          style={{ ["--progress-duration" as string]: `${STEP_MS}ms`, transform: auto ? undefined : "scaleX(1)" }}
                        />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mx-auto">
            <PhoneFrame>
              <div key={active} className="flex flex-1 animate-rise flex-col px-3 pb-4">
                {active === 0 ? <PageScreen /> : null}
                {active === 1 ? <RequestScreen /> : null}
                {active === 2 ? <SendScreen /> : null}
                {active === 3 ? <ApprovedScreen /> : null}
              </div>
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-1 pb-3 pt-1 text-center text-[13px] font-semibold">{children}</p>;
}

function PageScreen() {
  return (
    <>
      <ScreenTitle>Minha página</ScreenTitle>
      <div className="rounded-2xl bg-card p-3 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-ink-text">PN</span>
          <div>
            <p className="text-sm font-semibold">Pintura Norte</p>
            <p className="text-[11px] text-text-soft">pintura-norte.orcah.com.br</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {["fachada", "sala", "muro"].map((name) => (
            <span key={name} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={`/demo/trabalho-${name}.webp`} alt="" fill sizes="80px" className="object-cover" />
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["Fotos", "4 trabalhos"],
          ["Serviços", "3 com preço"],
          ["Botão de pedido", "Ativo"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5 text-sm shadow-card">
            <span>{label}</span>
            <span className="text-[12px] text-ok">{value} ✓</span>
          </div>
        ))}
      </div>
      <p className="mt-auto flex h-11 items-center justify-center rounded-xl bg-ink text-[13px] font-semibold text-ink-text">
        Copiar link da página
      </p>
    </>
  );
}

function RequestScreen() {
  return (
    <>
      <ScreenTitle>Pedidos</ScreenTitle>
      <div className="relative rounded-2xl bg-card p-3 shadow-card">
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-gold" aria-hidden />
        <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-gold-deep">Novo · agora</p>
        <p className="mt-1 text-sm font-semibold">Pintar sala e cozinha</p>
        <p className="text-[12px] text-text-soft">Maria Silva · Centro</p>
        <p className="mt-2 rounded-xl bg-paper px-3 py-2 text-[12px] text-text-soft">“Vi as fotos da sala verde. Quero algo parecido.”</p>
        <p className="mt-3 rounded-xl bg-ink py-2 text-center text-[13px] font-semibold text-ink-text">Fazer orçamento</p>
      </div>
      {[
        ["Textura no muro", "João Alves · ontem"],
        ["Pintura da fachada", "Ana Costa · 2 dias"],
      ].map(([title, meta]) => (
        <div key={title} className="mt-2 rounded-2xl bg-card/70 p-3">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[12px] text-text-soft">{meta}</p>
        </div>
      ))}
    </>
  );
}

function SendScreen() {
  return (
    <>
      <ScreenTitle>Novo orçamento</ScreenTitle>
      <div className="space-y-2">
        {[
          ["Pintura interna", "R$ 1.840,00"],
          ["Massa corrida", "R$ 610,00"],
        ].map(([name, price]) => (
          <div key={name} className="flex items-center justify-between rounded-2xl bg-card p-3 text-sm shadow-card">
            <span className="font-medium">{name}</span>
            <span className="font-semibold tabular-nums">{price}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-2xl bg-card p-3 shadow-card">
        <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-text-soft">Total</p>
        <p className="text-xl font-semibold">R$ 2.450,00</p>
        <p className="mt-2 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zap text-sm font-semibold text-ink">
          <WhatsAppGlyph />
          Enviar no WhatsApp
        </p>
      </div>
    </>
  );
}

function ApprovedScreen() {
  return (
    <>
      <ScreenTitle>Orçamentos</ScreenTitle>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ["12", "enviados"],
          ["9", "vistos"],
          ["5", "aprovados"],
        ].map(([n, label]) => (
          <div key={label} className="rounded-xl bg-card px-2 py-2 text-center shadow-card">
            <p className="text-lg font-semibold">{n}</p>
            <p className="text-[10px] text-text-soft">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["Maria Silva", "R$ 2.450,00", "Aprovado", "bg-ok-wash text-ok"],
          ["João Alves", "R$ 890,00", "Visualizado", "bg-wait-wash text-wait"],
          ["Ana Costa", "R$ 1.320,00", "Enviado", "bg-paper-alt text-text-soft"],
        ].map(([name, total, status, tone], index) => (
          <div
            key={name}
            className={`flex items-center justify-between rounded-2xl bg-card p-3 shadow-card ${index === 0 ? "ring-1 ring-ok/40" : ""}`}
          >
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-[11px] text-text-soft">{total}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone} ${index === 0 ? "animate-pop" : ""}`}>{status}</span>
          </div>
        ))}
      </div>
    </>
  );
}
