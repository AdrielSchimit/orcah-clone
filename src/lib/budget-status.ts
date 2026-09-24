import { BudgetStatus } from "@prisma/client";

export const budgetStatusLabel: Record<BudgetStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  viewed: "Visualizado",
  waiting: "Aguardando",
  approved: "Aprovado",
  rejected: "Recusado",
  expired: "Expirado",
};
