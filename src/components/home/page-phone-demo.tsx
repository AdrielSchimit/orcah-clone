"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useInView } from "./motion";
import { PhoneFrame } from "./phone-frame";

const tabs = ["Trabalhos", "Serviços", "Pedir orçamento"] as const;
const photos = [
  ["/demo/trabalho-fachada.webp", "Fachada"],
  ["/demo/trabalho-sala.webp", "Sala"],
  ["/demo/trabalho-muro.webp", "Muro"],
  ["/demo/trabalho-acabamento.webp", "Acabamento"],
] as const;
const services = [
  ["Pintura interna", "a partir de R$ 23/m²"],
  ["Pintura externa", "a partir de R$ 32/m²"],
  ["Textura e grafiato", "a partir de R$ 40/m²"],
];

export function PagePhoneDemo() {
  const { ref, inView } = useInView<HTMLDivElement>(0.5);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const [formTimeline, setFormStep] = useState(0);
  const formStep = active === 2 ? formTimeline : 0;

  useEffect(() => {
    if (!inView || touched) return;
    const id = setInterval(() => setActive((current) => (current + 1) % tabs.length), 4500);
    return () => clearInterval(id);
  }, [inView, touched]);

  useEffect(() => {
    if (active !== 2) return;
    const timers = [0, 400, 900, 1400, 2100].map((ms, index) => setTimeout(() => setFormStep(index), ms));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div ref={ref} className="relative mx-auto w-fit">
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[3rem] bg-paper-alt" />
      <PhoneFrame screenClassName="bg-paper">
        <div className="relative -mt-9 h-28 shrink-0">
          <Image src="/demo/trabalho-fachada.webp" alt="" fill sizes="272px" className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-b from-ink/40 to-transparent" />
        </div>
        <div className="-mt-7 px-4 text-center">
          <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-base font-semibold text-ink-text ring-4 ring-paper">
            PN
          </span>
          <p className="mt-2 font-semibold">Pintura Norte</p>
          <p className="text-[11px] text-text-soft">Pintor · Maravilha-SC e Região</p>
        </div>

        <div role="tablist" aria-label="Página da empresa" className="relative mx-3 mt-3 grid grid-cols-3 rounded-xl bg-paper-alt p-1 text-[11px] font-medium">
          <span
            aria-hidden
            className="absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/3)] rounded-lg bg-card shadow-card transition-transform duration-300 ease-soft"
            style={{ transform: `translateX(${active * 100}%)` }}
          />
          {tabs.map((tab, index) => (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={active === index}
              onClick={() => {
                setTouched(true);
                setPhoto(null);
                setActive(index);
              }}
              className={`relative z-10 min-h-9 rounded-lg px-1 transition-colors ${active === index ? "text-text" : "text-text-soft"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div key={active} role="tabpanel" className="relative flex-1 animate-rise overflow-hidden p-3">
          {active === 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {photos.map(([src, label], index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => {
                    setTouched(true);
                    setPhoto(index);
                  }}
                  className="group relative aspect-square overflow-hidden rounded-xl"
                  aria-label={`Ampliar ${label}`}
                >
                  <Image src={src} alt={label} fill sizes="130px" className="object-cover transition-transform duration-300 group-active:scale-95" />
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/70 to-transparent px-2 pb-1.5 pt-4 text-left text-[10px] font-medium text-ink-text">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {active === 1 ? (
            <div className="space-y-2">
              {services.map(([name, price]) => (
                <div key={name} className="flex items-center justify-between rounded-xl bg-card p-3 shadow-card">
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-[11px] text-text-soft">{price}</p>
                  </div>
                  <span className="text-text-soft">›</span>
                </div>
              ))}
            </div>
          ) : null}
          {active === 2 ? (
            <div className="space-y-2">
              <Field label="Nome" value={formStep >= 1 ? "Maria Silva" : ""} />
              <Field label="Bairro" value={formStep >= 2 ? "Centro" : ""} />
              <Field label="O que precisa" value={formStep >= 3 ? "Pintar sala e cozinha" : ""} />
              {formStep >= 4 ? (
                <p className="animate-pop rounded-xl bg-ok-wash px-3 py-2.5 text-center text-sm font-medium text-ok">
                  Pedido enviado ✓
                </p>
              ) : (
                <p className="rounded-xl bg-gold py-2.5 text-center text-sm font-semibold text-ink">Pedir orçamento</p>
              )}
            </div>
          ) : null}

          {photo !== null ? (
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute inset-0 z-10 flex animate-rise flex-col bg-ink p-3 text-left"
              aria-label="Fechar foto"
            >
              <span className="relative flex-1 overflow-hidden rounded-xl">
                <Image src={photos[photo][0]} alt={photos[photo][1]} fill sizes="272px" className="object-cover" />
              </span>
              <span className="mt-2 flex items-center justify-between text-[11px] text-ink-text">
                {photos[photo][1]}
                <span className="text-ink-soft">Toque para fechar</span>
              </span>
            </button>
          ) : null}
        </div>
      </PhoneFrame>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-xl border bg-card px-3 py-2 transition-colors ${value ? "border-line" : "border-dashed border-line"}`}>
      <p className="text-[10px] uppercase tracking-[0.04em] text-text-soft">{label}</p>
      <p className="min-h-5 text-sm">{value || "\u00a0"}</p>
    </div>
  );
}
