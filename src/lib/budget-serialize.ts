import { Prisma } from "@prisma/client";
import { moneyString } from "@/lib/money";
import { parseBudgetItems } from "@/lib/budget";
import { parseExtras } from "@/lib/templates";

export function serializeBudget<
  T extends { subtotal: Prisma.Decimal; discount: Prisma.Decimal; total: Prisma.Decimal },
>(budget: T) {
  return {
    ...budget,
    subtotal: moneyString(Number(budget.subtotal)),
    discount: moneyString(Number(budget.discount)),
    total: moneyString(Number(budget.total)),
  };
}

export function mapItemCreates(items: ReturnType<typeof parseBudgetItems>) {
  return items.map((item) => ({
    description: item.description,
    quantity: moneyString(item.quantity),
    unit: item.unit,
    unitPrice: moneyString(item.unitPrice),
    discount: moneyString(item.discount),
    subtotal: moneyString(item.subtotal),
    kind: item.kind,
    groupName: item.groupName,
    notes: item.notes,
    material: item.material,
    deadline: item.deadline,
    length: item.length,
    width: item.width,
    height: item.height,
    areaNote: item.areaNote,
    powerNote: item.powerNote,
    volumeNote: item.volumeNote,
    sortOrder: item.sortOrder,
  }));
}

export function extrasJson(raw: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return parseExtras(raw) ?? Prisma.JsonNull;
}
