import { formatBRL, formatQuantity, parseMoney, roundMoney } from "@/lib/money";
import { appOrigin } from "@/lib/urls";
import { nationalPhone, whatsappPhoneError } from "@/lib/whatsapp";

export const MAX_QUOTE_ITEMS = 60;

export function quoteSupplierUrl(token: string) {
  return `${appOrigin()}/cotacao/${token}`;
}

export function parseSupplierInput(input: { name?: unknown; store?: unknown; whatsapp?: unknown }) {
  const name = String(input.name ?? "").trim().slice(0, 120);
  const store = String(input.store ?? "").trim().slice(0, 120);
  const whatsapp = nationalPhone(String(input.whatsapp ?? ""));
  if (name.length < 2) return { error: "Coloque o nome do vendedor." } as const;
  const phoneError = whatsappPhoneError(whatsapp);
  if (phoneError) return { error: "Confira o WhatsApp do vendedor (DDD + celular)." } as const;
  return { data: { name, store: store || null, whatsapp } } as const;
}

export function parseQuoteItems(input: unknown) {
  if (!Array.isArray(input)) return { error: "Coloque pelo menos um produto." } as const;
  const items = input
    .map((raw) => {
      const item = (raw ?? {}) as { description?: unknown; quantity?: unknown };
      return {
        description: String(item.description ?? "").trim().replace(/\s+/g, " ").slice(0, 160),
        quantity: parseMoney(String(item.quantity ?? "1")),
      };
    })
    .filter((item) => item.description);
  if (!items.length) return { error: "Coloque pelo menos um produto." } as const;
  if (items.length > MAX_QUOTE_ITEMS) return { error: `No máximo ${MAX_QUOTE_ITEMS} produtos por cotação.` } as const;
  if (items.some((item) => item.quantity <= 0 || item.quantity > 99_999)) {
    return { error: "Confira as quantidades." } as const;
  }
  return { data: items } as const;
}

export function parseIdList(input: unknown) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

/** Valor que o vendedor digitou. null = não tem o item. */
export function parseOfferPrice(value: unknown) {
  if (value == null || String(value).trim() === "") return null;
  const price = parseMoney(String(value));
  return price > 0 && price < 10_000_000 ? price : null;
}

type OfferLike = { id: number; itemId: number; unitPrice: number | null };

/** Para cada item, a oferta de menor preço (empate: a primeira). */
export function cheapestOfferIds(offers: OfferLike[]) {
  const best = new Map<number, OfferLike>();
  for (const offer of offers) {
    if (offer.unitPrice == null) continue;
    const current = best.get(offer.itemId);
    if (!current || offer.unitPrice < (current.unitPrice as number)) best.set(offer.itemId, offer);
  }
  return [...best.values()].map((offer) => offer.id);
}

function oi(name: string) {
  const first = name.trim().split(/\s+/)[0];
  return first ? `Oi, ${first}!` : "Oi!";
}

export function quoteRequestMessage(input: { supplierName: string; companyName: string; itemCount: number; url: string }) {
  const itens = input.itemCount === 1 ? "1 item" : `${input.itemCount} itens`;
  return [
    oi(input.supplierName),
    `Aqui é da ${input.companyName}. Pode me passar o preço desses produtos (${itens})?`,
    "",
    "É só preencher a marca e o valor aqui:",
    input.url,
  ].join("\n");
}

export type ReservedLine = { description: string; quantity: number; brand: string | null; unitPrice: number };

export function reservationTotal(lines: ReservedLine[]) {
  return roundMoney(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
}

export function reservationMessage(input: { supplierName: string; companyName: string; lines: ReservedLine[] }) {
  const rows = input.lines.map((line) => {
    const brand = line.brand ? ` (${line.brand})` : "";
    return `• ${formatQuantity(line.quantity)}x ${line.description}${brand} · ${formatBRL(line.quantity * line.unitPrice)}`;
  });
  return [
    oi(input.supplierName),
    `Aqui é da ${input.companyName}. Quero reservar estes itens da sua cotação:`,
    "",
    ...rows,
    "",
    `Total: ${formatBRL(reservationTotal(input.lines))}`,
    "",
    "Me confirma, por favor?",
  ].join("\n");
}
