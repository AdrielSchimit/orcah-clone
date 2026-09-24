import type { BudgetExtras } from "@/lib/templates";

export function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export function whatsappNumber(phone: string) {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export { budgetPublicUrl, companyPublicUrl } from "@/lib/urls";

export function whatsappBudgetMessage(input: {
  customerName: string;
  number: string;
  totalLabel: string;
  url: string;
  templateKey?: string;
  address?: string | null;
  city?: string | null;
  days?: number | null;
  extras?: BudgetExtras | null;
}) {
  const first = input.customerName.split(" ")[0];
  const prazo = input.days ? `${input.days} dia(s)` : "";
  const local = input.address || input.city || "";

  if (input.templateKey === "equipe-obra") {
    return [
      `Olá, ${first}! Separei o orçamento da obra${local ? ` em ${local}` : ""}.`,
      `📋 ${input.number} · 💰 ${input.totalLabel}${prazo ? ` · ⏱ ${prazo}` : ""}`,
      "Fotos e serviços estão no link:",
      input.url,
    ].join("\n");
  }

  if (input.templateKey === "acabamento-visual") {
    const ambiente = input.extras?.scope ? ` (${input.extras.scope})` : "";
    return [
      `Olá, ${first}! Mandei o orçamento da pintura${ambiente} com as fotos.`,
      `${input.number} · ${input.totalLabel}`,
      input.url,
    ].join("\n");
  }

  if (input.templateKey === "construtora") {
    const tipo = input.extras?.workType || "obra";
    const area = input.extras?.areaM2 ? ` · Área ${input.extras.areaM2} m²` : "";
    return [
      `Olá, ${first}! Orçamento da ${tipo}${input.city ? ` em ${input.city}` : ""}, separado por etapas.`,
      `${area ? area.trim() + " · " : ""}${prazo ? `Prazo ${prazo} · ` : ""}Total ${input.totalLabel}`,
      input.url,
    ].join("\n");
  }

  if (input.templateKey === "oficina-tecnico") {
    return [
      `Olá, ${first}! Segue o orçamento${input.extras?.equipment ? ` do ${input.extras.equipment}` : ""}.`,
      [input.extras?.brand, input.extras?.model].filter(Boolean).join(" ")
        ? `Marca/modelo: ${[input.extras?.brand, input.extras?.model].filter(Boolean).join(" ")}`
        : "",
      input.extras?.diagnosis ? `Diagnóstico: ${input.extras.diagnosis}` : "",
      `${input.number} · ${input.totalLabel}${prazo ? ` · prazo ${prazo}` : ""}`,
      input.url,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (input.templateKey === "revestimento") {
    const m2 = input.extras?.areaM2 ? ` · ${input.extras.areaM2} m²` : "";
    return [
      `Olá, ${first}! Orçamento do revestimento${local ? ` em ${local}` : ""}.`,
      `${input.number}${m2} · ${input.totalLabel}`,
      input.url,
    ].join("\n");
  }

  return [
    `Olá, ${first}! 👋`,
    "",
    "Preparei seu orçamento para o serviço solicitado.",
    "",
    `📋 Orçamento: ${input.number}`,
    `💰 Valor: ${input.totalLabel}`,
    "",
    "Você pode visualizar todos os detalhes pelo link:",
    "",
    input.url,
    "",
    "Qualquer dúvida, estou à disposição.",
  ].join("\n");
}

export function whatsappHref(phone: string, message: string) {
  const number = whatsappNumber(phone);
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
