"use client";

import { useEffect, useRef } from "react";

type PageEvent = "view" | "whatsapp" | "quote";

function track(slug: string, tipo: PageEvent) {
  const url = `/api/publico/empresas/${encodeURIComponent(slug)}/metrica`;
  const body = JSON.stringify({ tipo });
  try {
    // sendBeacon sobrevive à troca de página (clique no WhatsApp sai do site)
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // segue para o fetch
  }
  void fetch(url, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
}

export function PageViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(slug, "view");
  }, [slug]);
  return null;
}

export function TrackedLink({
  slug,
  event,
  href,
  className,
  children,
  external,
  ariaLabel,
}: {
  slug: string;
  event: Exclude<PageEvent, "view">;
  href: string;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={() => track(slug, event)}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
