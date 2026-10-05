"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { appUrl } from "@/lib/urls";

/** Barra fixa de cadastro no mobile: só depois do hero e dos dois cards. */
export function HomeMobileStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("hero-comercial");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-line bg-ink p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        href={appUrl("/cadastro")}
        className="flex min-h-12 items-center justify-center rounded-btn bg-gold font-semibold text-ink"
      >
        Começar grátis
      </Link>
    </div>
  );
}
