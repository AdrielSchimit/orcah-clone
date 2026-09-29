"use client";

import { useEffect, useRef } from "react";

import { isInstagramOrigin } from "@/lib/page-stats";

type PageEvent = "view" | "whatsapp" | "quote" | "instagram";

function track(slug: string, tipo: PageEvent, origem?: "instagram") {
  const url = `/api/publico/empresas/${encodeURIComponent(slug)}/metrica`;
  const body = JSON.stringify(origem ? { tipo, origem } : { tipo });
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
    // "?servico=" vem do botão de um serviço na própria página: não é um acesso novo
    const params = new URLSearchParams(window.location.search);
    if (params.has("servico")) return;
    const origem = isInstagramOrigin(document.referrer, params.get("utm_source")) ? "instagram" : undefined;
    track(slug, "view", origem);
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
