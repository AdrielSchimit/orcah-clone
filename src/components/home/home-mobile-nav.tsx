"use client";

import Link from "next/link";
import { useRef } from "react";
import { appUrl } from "@/lib/urls";

export function HomeMobileNav({
  providerAreaHref,
  providerAreaLabel,
  loggedIn,
  aboutLinks,
}: {
  providerAreaHref: string;
  providerAreaLabel: string;
  loggedIn: boolean;
  aboutLinks: readonly (readonly [string, string])[];
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details ref={detailsRef} className="relative lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-medium text-text [&::-webkit-details-marker]:hidden">
        Menu
      </summary>
      <nav
        aria-label="Menu"
        className="absolute right-0 z-30 mt-1 w-[min(16rem,calc(100vw-2rem))] rounded-box border border-line bg-card p-2 shadow-card"
      >
        <Link
          href="/prestadores"
          onClick={close}
          className="flex min-h-11 items-center rounded-btn bg-gold-wash px-3 text-sm font-semibold text-gold-deep"
        >
          Encontrar profissionais
        </Link>
        <Link
          href={providerAreaHref}
          onClick={close}
          className="mt-1 flex min-h-11 items-center rounded-btn bg-paper px-3 text-sm font-semibold text-ink"
        >
          {providerAreaLabel}
        </Link>
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold tracking-[0.06em] text-text-soft">SOBRE O ORÇAH</p>
        {aboutLinks.map(([label, href]) => (
          <a
            key={href}
            href={href}
            onClick={close}
            className="flex min-h-11 items-center rounded-btn px-3 text-sm font-medium text-text"
          >
            {label}
          </a>
        ))}
        <a href="#plano" onClick={close} className="flex min-h-11 items-center rounded-btn px-3 text-sm font-medium text-text">
          Plano
        </a>
        {!loggedIn ? (
          <Link
            href={appUrl("/cadastro")}
            onClick={close}
            className="mt-1 flex min-h-11 items-center justify-center rounded-btn bg-gold px-3 text-sm font-semibold text-ink"
          >
            Começar grátis
          </Link>
        ) : null}
      </nav>
    </details>
  );
}
