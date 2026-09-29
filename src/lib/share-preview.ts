export type SharePreview = {
  title: string;
  eyebrow: string;
  description: string;
  footer: string;
};

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function companySharePreview(input: {
  name: string;
  ramo?: string | null;
  place?: string | null;
  description?: string | null;
  host: string;
}): SharePreview {
  const name = input.name.trim() || "Orçah";
  const eyebrow = [input.ramo?.trim(), input.place?.trim()].filter(Boolean).join(" · ");
  const description = input.description?.trim() || `Peça seu orçamento para ${name} pelo celular.`;
  return {
    title: clip(name, 42),
    eyebrow: clip(eyebrow, 72),
    description: clip(description, 140),
    footer: clip(input.host.replace(/^https?:\/\//, ""), 80),
  };
}

export function budgetSharePreview(input: {
  companyName: string;
  number: string;
  service?: string | null;
  totalLabel?: string | null;
}): SharePreview {
  const company = input.companyName.trim() || "Orçah";
  const detail = [input.service?.trim(), input.totalLabel?.trim()].filter(Boolean).join(" · ");
  return {
    title: clip(company, 42),
    eyebrow: "Orçamento",
    description: clip(detail || `Proposta ${input.number}`, 140),
    footer: clip(input.number, 40),
  };
}
