"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { closedQuoteRequestUrl, quoteRequestUrl } from "@/lib/quote-request";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { TrackedLink, trackPageEvent } from "@/components/page-tracking";

type QuoteContext = { open: (service: string, trigger: HTMLButtonElement) => void };
const Context = createContext<QuoteContext | null>(null);

export function QuoteRequestButton({ service = "", className = "", children = "Pedir orçamento" }: {
  service?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const context = useContext(Context);
  if (!context) throw new Error("QuoteRequestButton precisa de ProviderQuoteExperience");
  return <button type="button" className={`provider-button ${className}`} aria-haspopup="dialog"
    onClick={(event) => context.open(service, event.currentTarget)}>{children}</button>;
}

export function ProviderQuoteExperience({ slug, services, initialService = "", whatsappUrl, primaryClassName, children }: {
  slug: string;
  services: string[];
  initialService?: string;
  whatsappUrl: string;
  primaryClassName: string;
  children: React.ReactNode;
}) {
  const [request, setRequest] = useState<{ service: string } | null>(initialService ? { service: initialService } : null);
  const [pastHero, setPastHero] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const heroButton = useRef<HTMLButtonElement | null>(null);
  const sticky = useRef<HTMLDivElement>(null);

  const open = useCallback((service: string, button: HTMLButtonElement) => {
    trigger.current = button;
    setRequest({ service });
    // Preserve Next's history state while updating the shareable URL without navigation.
    window.history.replaceState(window.history.state, "", quoteRequestUrl(window.location.href, service));
    trackPageEvent(slug, "quote");
  }, [slug]);

  const close = useCallback(() => {
    setRequest(null);
    window.history.replaceState(window.history.state, "", closedQuoteRequestUrl(window.location.href));
    // A sticky opener is hidden while the dialog is open; restore its focus after rendering.
    requestAnimationFrame(() => {
      const target = trigger.current?.isConnected ? trigger.current : heroButton.current;
      target?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const hero = document.getElementById("provider-hero");
    heroButton.current = hero?.querySelector<HTMLButtonElement>("button[aria-haspopup=dialog]") ?? null;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const readDeepLink = () => {
      const url = new URL(window.location.href);
      if (url.hash === "#pedir" || url.searchParams.has("servico")) {
        trigger.current = heroButton.current;
        setRequest({ service: (url.searchParams.get("servico") ?? "").slice(0, 160) });
      } else setRequest(null);
    };
    // Hash-only links are not available to the server. Read them after hydration.
    const frame = requestAnimationFrame(readDeepLink);
    window.addEventListener("popstate", readDeepLink);
    window.addEventListener("hashchange", readDeepLink);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("popstate", readDeepLink);
      window.removeEventListener("hashchange", readDeepLink);
    };
  }, []);

  useEffect(() => {
    if (!request || !dialog.current) return;
    const element = dialog.current;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    element.showModal();
    return () => {
      document.documentElement.style.overflow = overflow;
      if (element.open) element.close();
    };
  }, [request]);

  // Keep space for the bar only when it is actually shown, including the iPhone safe area.
  useEffect(() => {
    const bar = sticky.current;
    if (!bar) return;
    const page = bar.closest<HTMLElement>(".public-company-page");
    if (!page) return;
    if (!pastHero) {
      page.style.removeProperty("--provider-sticky-space");
      return;
    }
    // Retain the reserved space while the sheet hides the bar, avoiding a scroll jump.
    if (request) return;
    const observer = new ResizeObserver(() => {
      page.style.setProperty("--provider-sticky-space", `${bar.getBoundingClientRect().height}px`);
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
    };
  }, [pastHero, request]);

  return <Context.Provider value={{ open }}>
    {children}
    <div ref={sticky} className="provider-sticky" hidden={!pastHero || Boolean(request)} aria-label="Contato rápido">
      <QuoteRequestButton className={primaryClassName} />
      {whatsappUrl ? <TrackedLink slug={slug} event="whatsapp" href={whatsappUrl} external className="provider-button provider-whatsapp">WhatsApp</TrackedLink> : null}
    </div>
    {request ? <dialog ref={dialog} className="provider-quote-dialog" aria-modal="true" aria-labelledby="quote-dialog-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, a[href], [tabindex="0"]',
        )).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="provider-dialog-header">
        <h2 id="quote-dialog-title">Solicitar orçamento</h2>
        <button type="button" className="provider-dialog-close" aria-label="Fechar orçamento" onClick={close}>×</button>
      </div>
      <QuoteRequestForm key={request.service} slug={slug} defaultService={request.service} services={services} submitClassName={primaryClassName} inDialog />
    </dialog> : null}
  </Context.Provider>;
}
