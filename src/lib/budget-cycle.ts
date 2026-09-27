import type { Prisma } from "@prisma/client";

export type CycleStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "waiting"
  | "approved"
  | "rejected"
  | "expired";

export function publicCanRespond(status: CycleStatus | string) {
  return status === "draft" || status === "sent" || status === "viewed";
}

export function statusAfterProviderEdit(status: CycleStatus) {
  return status === "waiting" ? "sent" : status;
}

export function nextBudgetVersion(latest: number | null | undefined) {
  return (latest ?? 0) + 1;
}

export function republishEventMetadata(input: {
  version: number;
  total: string;
  previousTotal: string;
}) {
  return {
    republished: true,
    version: input.version,
    total: input.total,
    previousTotal: input.previousTotal,
  };
}

export function isRepublishMetadata(metadata: unknown): metadata is {
  republished: true;
  version?: number;
  total?: string;
  previousTotal?: string;
} {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      "republished" in metadata &&
      (metadata as { republished?: unknown }).republished === true,
  );
}

type RepublishDb = Pick<Prisma.TransactionClient, "budget" | "budgetVersion">;

/**
 * Dentro da transação da edição: tira o orçamento de "waiting" só se ele ainda estiver lá
 * (trava a linha; um segundo salvar simultâneo, ou uma resposta do cliente no meio, perde)
 * e guarda a versão anterior. Devolve o número da versão, ou null se já não estava em "waiting".
 */
export async function claimRepublish(
  tx: RepublishDb,
  existing: { id: number; subtotal: Prisma.Decimal | string; discount: Prisma.Decimal | string; total: Prisma.Decimal | string; notes: string | null },
) {
  const claimed = await tx.budget.updateMany({
    where: { id: existing.id, status: "waiting" },
    data: { status: "sent" },
  });
  if (claimed.count === 0) return null;
  const last = await tx.budgetVersion.findFirst({
    where: { budgetId: existing.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = nextBudgetVersion(last?.version);
  await tx.budgetVersion.create({
    data: {
      budgetId: existing.id,
      version,
      subtotal: existing.subtotal,
      discount: existing.discount,
      total: existing.total,
      notes: existing.notes,
    },
  });
  return version;
}

export class BudgetEditConflict extends Error {}
