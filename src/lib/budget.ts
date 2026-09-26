import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { normalizeCommercialTerms, type CommercialInput } from "@/lib/commercial";
import { parseMoney, roundMoney } from "@/lib/money";
import { isItemKind, travelFeeAmount, type BudgetExtras } from "@/lib/templates";

const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createPublicToken() {
  const bytes = randomBytes(10);
  let token = "";
  for (const byte of bytes) {
    token += TOKEN_CHARS[byte % TOKEN_CHARS.length];
  }
  return token;
}

export async function nextBudgetNumber(companyId: number) {
  const year = new Date().getFullYear();
  const prefix = `ORÇ-${year}-`;
  const last = await prisma.budget.findFirst({
    where: { companyId, number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const sequence = last ? Number(last.number.slice(-6)) + 1 : 1;
  return `${prefix}${String(sequence).padStart(6, "0")}`;
}

export function itemSubtotal(quantity: number, unitPrice: number, discount: number) {
  return Math.max(0, Math.round((quantity * unitPrice - discount) * 100) / 100);
}

export type ItemInput = {
  description?: string;
  quantity?: string | number;
  unit?: string;
  unitPrice?: string | number;
  discount?: string | number;
  kind?: string | null;
  groupName?: string | null;
  notes?: string | null;
  material?: string | null;
  deadline?: string | null;
  length?: string | null;
  width?: string | null;
  height?: string | null;
  areaNote?: string | null;
  powerNote?: string | null;
  volumeNote?: string | null;
};

export function parseBudgetItems(raw: ItemInput[] | undefined) {
  return (raw ?? [])
    .map((item, index) => {
      const description = item.description?.trim() ?? "";
      const quantity = parseMoney(item.quantity) || 1;
      const unitPrice = parseMoney(item.unitPrice);
      const discount = parseMoney(item.discount);
      const kind = isItemKind(item.kind ?? "") ? item.kind : null;
      const groupName = item.groupName?.trim() || null;
      const notes = item.notes?.trim() || null;
      const material = item.material?.trim() || null;
      const deadline = item.deadline?.trim() || null;
      const length = item.length?.trim() || null;
      const width = item.width?.trim() || null;
      const height = item.height?.trim() || null;
      const areaNote = item.areaNote?.trim() || null;
      const powerNote = item.powerNote?.trim() || null;
      const volumeNote = item.volumeNote?.trim() || null;
      return {
        description,
        quantity,
        unit: item.unit?.trim() || "un",
        unitPrice,
        discount,
        kind,
        groupName,
        notes,
        material,
        deadline,
        length,
        width,
        height,
        areaNote,
        powerNote,
        volumeNote,
        subtotal: itemSubtotal(quantity, unitPrice, discount),
        sortOrder: index,
      };
    })
    .filter((item) => item.description.length > 0);
}

export function budgetTotals(
  subtotal: number,
  discount: number,
  extras?: BudgetExtras | null,
  commercial?: CommercialInput,
) {
  const itemsSubtotal = roundMoney(subtotal);
  const travel = travelFeeAmount(extras);
  const ceiling = roundMoney(itemsSubtotal + travel);
  if (discount < 0) {
    return { error: "Desconto inválido." as const };
  }
  const terms = commercial
    ? normalizeCommercialTerms(ceiling, commercial)
    : normalizeCommercialTerms(ceiling, { discountType: "amount", discountValue: discount });
  if ("error" in terms) return terms;
  if (terms.discountAmount > ceiling) {
    return { error: "Desconto maior que o subtotal." as const };
  }
  return {
    subtotal: itemsSubtotal,
    discount: terms.discountAmount,
    travel,
    total: roundMoney(Math.max(0, ceiling - terms.discountAmount)),
    commercial: terms,
  };
}

export function groupedItems<T extends { groupName?: string | null; subtotal: unknown }>(items: T[]) {
  const groups: { name: string; items: T[]; subtotal: number }[] = [];
  for (const item of items) {
    const name = item.groupName?.trim() || "";
    let group = groups.find((entry) => entry.name === name);
    if (!group) {
      group = { name, items: [], subtotal: 0 };
      groups.push(group);
    }
    group.items.push(item);
    group.subtotal = roundMoney(group.subtotal + Number(item.subtotal));
  }
  return groups;
}

export function kindSubtotals<T extends { kind?: string | null; subtotal: unknown }>(items: T[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    const kind = item.kind?.trim();
    if (!kind) continue;
    map.set(kind, roundMoney((map.get(kind) ?? 0) + Number(item.subtotal)));
  }
  return [...map.entries()];
}
