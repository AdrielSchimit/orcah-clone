"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/money";
import { useCountUp, useInView, usePrefersReducedMotion } from "./motion";
import { PhoneFrame } from "./phone-frame";

const items = [
  { name: "Pintura interna", detail: "80 m² × R$ 23,00", price: 1840, at: 500 },
  { name: "Massa corrida", detail: "2 paredes", price: 610, at: 1100 },
];

const SEND_AT = 2900;
const SENT_AT = 3500;

export function HeroQuoteDemo({ className = "" }: { className?: string }) {
  const { ref, inView: started } = useInView<HTMLDivElement>(0.2, true);
  const reduced = usePrefersReducedMotion();
  const [timeline, setTimeline] = useState(0);

  useEffect(() => {
    if (!started || reduced) return;
    const timers = [500, 1100, 1200, SEND_AT, SENT_AT].map((ms) => setTimeout(() => setTimeline(ms), ms));
    return () => timers.forEach(clearTimeout);
  }, [started, reduced]);

  const elapsed = started && reduced ? Infinity : timeline;

  const total = useCountUp(2450, elapsed >= 1200, 1400);
  const sent = elapsed >= SENT_AT;

  return (
    <div ref={ref} className={className}>
      <PhoneFrame>
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <span className="text-[13px] text-text-soft">‹ Voltar</span>
          <span className="text-[13px] font-semibold">Novo orçamento</span>
          <span className="w-10" />
        </div>

        <div className="flex-1 space-y-3 overflow-hidden px-3">
          <div className="flex items-center gap-2.5 rounded-2xl bg-card p-2.5 shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wait-wash text-xs font-semibold text-wait">
              MS
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.04em] text-text-soft">Cliente</p>
              <p className="truncate text-sm font-medium">Maria Silva</p>
            </div>
          </div>

          <p className="px-1 text-[10px] font-medium uppercase tracking-[0.04em] text-text-soft">Serviços</p>
          <div className="space-y-2">
            {items.map((item) =>
              elapsed >= item.at ? (
                <div key={item.name} className="flex animate-rise items-center justify-between rounded-2xl bg-card p-3 shadow-card">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-[11px] text-text-soft">{item.detail}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatBRL(item.price)}</p>
                </div>
              ) : (
                <div key={item.name} className="flex h-[58px] items-center gap-3 rounded-2xl bg-card/60 p-3">
                  <span className="h-2.5 w-24 animate-pulse rounded-full bg-paper-alt" />
                  <span className="ml-auto h-2.5 w-12 animate-pulse rounded-full bg-paper-alt" />
                </div>
              ),
            )}
          </div>
          <p className="px-1 text-[12px] font-medium text-text-soft">+ Adicionar serviço</p>
        </div>

        <div className="relative border-t border-line bg-card px-3 pb-5 pt-3">
          {sent ? (
            <p className="absolute inset-x-3 -top-12 flex animate-rise items-center gap-2 rounded-2xl bg-ink px-3 py-2.5 text-[12px] font-medium text-ink-text shadow-float">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zap text-[11px] text-ink">✓</span>
              Enviado para Maria no WhatsApp
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-text-soft">Total</p>
              <p className="text-lg font-semibold leading-6 tabular-nums" aria-hidden>
                {formatBRL(total)}
              </p>
              <p className="sr-only">R$ 2.450,00</p>
            </div>
            <span
              className={`ml-auto inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-zap text-sm font-semibold text-ink transition-transform duration-150 ${
                elapsed >= SEND_AT && !sent ? "scale-95" : ""
              }`}
            >
              <WhatsAppGlyph />
              Enviar
            </span>
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}

export function WhatsAppGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.87 9.87 0 0 0 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}
