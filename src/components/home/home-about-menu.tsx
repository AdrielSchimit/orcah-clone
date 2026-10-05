"use client";

import { useRef } from "react";

export function HomeAboutMenu({ links }: { links: readonly (readonly [string, string])[] }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details ref={detailsRef} className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-btn px-2.5 text-sm font-medium text-text hover:bg-paper [&::-webkit-details-marker]:hidden">
        Sobre o Orçah
        <Chevron />
      </summary>
      <nav
        aria-label="Sobre o Orçah"
        className="absolute left-0 z-30 mt-1 w-52 rounded-box border border-line bg-card p-2 shadow-card"
      >
        {links.map(([label, href]) => (
          <a
            key={href}
            href={href}
            onClick={close}
            className="flex min-h-11 items-center rounded-btn px-3 text-sm font-medium text-text hover:bg-paper"
          >
            {label}
          </a>
        ))}
      </nav>
    </details>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-text-soft" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
