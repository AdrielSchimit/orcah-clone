"use client";

import homeButtons from "@/components/home/home-buttons.module.css";

import Link from "next/link";
import { useRef } from "react";
import { appUrl } from "@/lib/urls";

export function HomeMobileNav({
  providerAreaHref,
  providerAreaLabel,
  loggedIn,
  links,
  loginPopoverId,
}: {
  providerAreaHref: string;
  providerAreaLabel: string;
  loggedIn: boolean;
  links: readonly (readonly [string, string])[];
  loginPopoverId?: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details ref={detailsRef} className="relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-medium text-text [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Menu</span>
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </summary>
      <nav
        aria-label="Menu"
        className="absolute right-0 z-30 mt-1 w-[min(16rem,calc(100vw-2rem))] rounded-box border border-line bg-card p-2 shadow-card"
      >
        {links.map(([label, href]) => (
          <a
            key={href}
            href={href}
            onClick={close}
            className="flex min-h-11 items-center rounded-btn px-3 text-sm font-medium text-text"
          >
            {label}
          </a>
        ))}
        <div className="my-2 h-px bg-line" />
        {!loggedIn && loginPopoverId ? <button type="button" popoverTarget={loginPopoverId} aria-haspopup="dialog" onClick={close} className="flex min-h-11 w-full items-center rounded-btn bg-paper px-3 text-sm font-semibold text-ink">{providerAreaLabel}</button> : <Link
          href={providerAreaHref}
          onClick={close}
          className="flex min-h-11 items-center rounded-btn bg-paper px-3 text-sm font-semibold text-ink"
        >
          {providerAreaLabel}
        </Link>}
        {!loggedIn ? (
          <Link
            href={appUrl("/cadastro")}
            onClick={close}
            className={`mt-1 flex min-h-11 items-center justify-center rounded-btn bg-gold px-3 text-sm font-semibold text-ink ${homeButtons.gold}`}
          >
            Começar grátis
          </Link>
        ) : null}
      </nav>
    </details>
  );
}
