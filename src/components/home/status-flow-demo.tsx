"use client";

import { useEffect, useState } from "react";
import { WhatsAppGlyph } from "./hero-quote-demo";
import { useInView, usePrefersReducedMotion } from "./motion";
import { PhoneFrame } from "./phone-frame";

const steps = [
  { label: "Enviado", text: "O link sai pelo seu WhatsApp, com seu nome.", note: "" },
  { label: "Visualizado", text: "Ele abriu. É a hora certa de ligar.", note: "Maria abriu seu orçamento" },
  { label: "Alteração pedida", text: "Quer mudar algo. Ajuste e mande de novo.", note: "Maria pediu uma alteração" },
  { label: "Aprovado", text: "Fechado. O aviso chega na hora.", note: "Maria aprovou · R$ 2.450,00" },
] as const;

const WA_BG = "#EFEAE2";
const WA_OUT = "#D9FDD3";
const WA_TICK = "#53BDEB";

export function StatusSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const reduced = usePrefersReducedMotion();
  const [loopStep, setStep] = useState(0);
  const step = reduced ? 3 : loopStep;

  useEffect(() => {
    if (reduced || !inView) return;
    const id = setInterval(() => setStep((current) => (current + 1) % steps.length), 2600);
    return () => clearInterval(id);
  }, [inView, reduced]);

  const current = steps[step];

  return (
    <section id="orcamentos" className="scroll-mt-24 bg-paper px-4 py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Depois que você manda</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-4xl md:leading-tight">Você sabe a hora que o cliente abriu.</h2>
          <p className="mt-3 max-w-md text-text-soft">
            Orçamento mandado no WhatsApp costuma sumir na conversa. No Orçah, cada link avisa você quando o cliente
            abre, aprova ou pede para mudar alguma coisa. Nada de ficar mandando “e aí, viu?”.
          </p>
          <ol className="mt-8 max-w-md space-y-1">
            {steps.map((item, index) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-300 ${
                    index === step ? "bg-card shadow-card" : "hover:bg-card/60"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-300 ${
                      index < step
                        ? "bg-ink text-ink-text"
                        : index === step
                          ? index === 3
                            ? "bg-ok text-card"
                            : "bg-ink text-ink-text"
                          : "border border-line bg-card text-text-soft"
                    }`}
                  >
                    {index < step || (index === 3 && step === 3) ? "✓" : index + 1}
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${index === step ? "text-text" : "text-text-soft"}`}>
                      {item.label}
                    </span>
                    <span className="block text-sm text-text-soft">{item.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div ref={ref} className="mx-auto">
          <PhoneFrame screenClassName="bg-card">
            <div className="absolute inset-0" style={{ background: WA_BG }} aria-hidden />
            <div className="relative z-10 flex items-center gap-2.5 bg-card px-3 pb-2.5 pt-1 shadow-[0_1px_0_var(--line)]">
              <span className="text-lg leading-none text-text-soft">‹</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wait-wash text-[11px] font-semibold text-wait">
                MS
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-4">Maria Silva</p>
                <p className="text-[10px] text-text-soft">{step >= 1 ? "online" : "visto por último hoje"}</p>
              </div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col justify-end gap-2 px-3 pb-4">
              <div className="ml-auto w-[88%] rounded-2xl rounded-tr-md p-1.5 shadow-sm" style={{ background: WA_OUT }}>
                <div className="overflow-hidden rounded-xl bg-card/80">
                  <div className="flex items-center gap-2 border-l-4 border-gold px-2.5 py-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold">Pintura Norte · Orçamento</p>
                      <p className="text-[10px] text-text-soft">Pintura interna · R$ 2.450,00</p>
                      <p className="truncate text-[10px] text-text-soft">orcah.com.br/orcamento/8F4K92</p>
                    </div>
                  </div>
                </div>
                <p className="px-1.5 pt-1.5 text-[12px] leading-4">Oi Maria! Segue o orçamento da pintura. Qualquer dúvida me chama.</p>
                <p className="flex items-center justify-end gap-1 px-1 text-[9px] text-text-soft">
                  10:42
                  <span style={{ color: step >= 1 ? WA_TICK : undefined }} className="text-[11px] font-semibold tracking-[-0.2em] transition-colors duration-500">
                    ✓✓
                  </span>
                </p>
              </div>

              {step >= 2 ? (
                <div className="mr-auto max-w-[80%] animate-rise rounded-2xl rounded-tl-md bg-card px-3 py-2 text-[12px] leading-4 shadow-sm">
                  Dá pra fazer sem a massa corrida?
                  <p className="mt-0.5 text-right text-[9px] text-text-soft">10:51</p>
                </div>
              ) : null}
              {step >= 3 ? (
                <div className="mr-auto max-w-[80%] animate-rise rounded-2xl rounded-tl-md bg-card px-3 py-2 text-[12px] leading-4 shadow-sm">
                  Vi o novo valor. Aprovei! Quando pode começar?
                  <p className="mt-0.5 text-right text-[9px] text-text-soft">11:03</p>
                </div>
              ) : null}
            </div>

            <div className="relative z-10 flex items-center gap-2 bg-transparent px-2 pb-4">
              <span className="flex-1 rounded-full bg-card px-3 py-2 text-[11px] text-text-soft">Mensagem</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zap text-ink">
                <WhatsAppGlyph className="h-4 w-4" />
              </span>
            </div>

            {current.note ? (
              <div
                key={step}
                className="absolute inset-x-2 top-10 z-30 flex animate-notify items-center gap-2.5 rounded-2xl bg-card/95 p-2.5 shadow-float backdrop-blur"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${step === 3 ? "bg-ok text-card" : "bg-ink text-gold"}`}>
                  {step === 3 ? "✓" : "O"}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[10px] text-text-soft">
                    <span className="font-semibold text-text">Orçah</span> · agora
                  </p>
                  <p className="truncate text-[12px] font-medium">{current.note}</p>
                </div>
              </div>
            ) : null}
            <p className="sr-only" aria-live="polite">
              Status: {current.label}
            </p>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
