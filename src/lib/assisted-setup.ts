import type { AssistedSetupStatus, PrismaClient } from "@prisma/client";

/** Configuração assistida ("a gente configura pra você"). Só registra o pedido; sem cobrança. */

export type AssistedSetupDb = Pick<PrismaClient, "assistedSetupRequest">;

export const ASSISTED_SETUP_PRICE_LABEL = "R$ 30 uma vez";
export const ACTIVE_SETUP_STATUSES: AssistedSetupStatus[] = ["requested", "contacted", "in_progress"];

export function findActiveAssistedSetup(db: AssistedSetupDb, companyId: number) {
  return db.assistedSetupRequest.findFirst({
    where: { companyId, status: { in: ACTIVE_SETUP_STATUSES } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, createdAt: true },
  });
}

/** Cria o pedido, ou devolve o que já está aberto (não duplica). */
export async function requestAssistedSetup(db: AssistedSetupDb, companyId: number, notes?: unknown) {
  const active = await findActiveAssistedSetup(db, companyId);
  if (active) return { request: active, created: false };
  const request = await db.assistedSetupRequest.create({
    data: { companyId, notes: String(notes ?? "").trim().slice(0, 1000) || null },
    select: { id: true, status: true, createdAt: true },
  });
  return { request, created: true };
}

export const ASSISTED_SETUP_STATUS_LABEL: Record<AssistedSetupStatus, string> = {
  requested: "Pedido recebido",
  contacted: "Entramos em contato",
  in_progress: "Em configuração",
  completed: "Concluído",
  canceled: "Cancelado",
};
