"use client";

import { useEffect } from "react";

/** Abre a seção (<details id=...>) quando o link do checklist aponta para ela. */
export function OpenDetailsOnHash() {
  useEffect(() => {
    const open = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const element = document.getElementById(id);
      if (element instanceof HTMLDetailsElement) {
        element.open = true;
        element.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
