"use client";

import { useState } from "react";

export function CopyLinkButton({
  url,
  label = "Copiar link público",
  variant = "outline",
}: {
  url: string;
  label?: string;
  variant?: "primary" | "outline";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const className =
    variant === "primary"
      ? "min-h-12 rounded-btn bg-gold px-4 text-sm font-semibold text-ink"
      : "min-h-12 rounded-btn border border-line bg-card px-4 text-sm font-medium text-text";

  return (
    <button type="button" onClick={copy} className={`w-full ${className}`}>
      {copied ? "Link copiado" : label}
    </button>
  );
}
