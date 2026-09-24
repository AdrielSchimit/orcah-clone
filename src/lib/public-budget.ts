import { BudgetStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clientIp, clientUserAgent } from "@/lib/http";

const closed: BudgetStatus[] = ["approved", "rejected", "expired"];

export const publicBudgetInclude = {
  items: { orderBy: { sortOrder: "asc" as const } },
  photos: { orderBy: { sortOrder: "asc" as const } },
  customer: { select: { name: true, phone: true, whatsapp: true } },
  serviceCity: { select: { name: true } },
  serviceState: { select: { uf: true } },
  company: {
    include: {
      city: { select: { name: true } },
      state: { select: { name: true, uf: true } },
      businessCategory: { select: { name: true, slug: true, templateKey: true } },
    },
  },
} satisfies Prisma.BudgetInclude;

export async function findPublicBudget(token: string) {
  return prisma.budget.findUnique({
    where: { publicToken: token },
    include: publicBudgetInclude,
  });
}

export function isClosed(status: BudgetStatus) {
  return closed.includes(status);
}

export async function recordBudgetEvent(
  request: Request,
  budgetId: number,
  event: "viewed" | "approved" | "rejected" | "revision_requested" | "sent",
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.budgetEvent.create({
    data: {
      budgetId,
      event,
      metadata,
      ipAddress: clientIp(request),
      userAgent: clientUserAgent(request),
    },
  });
}

export function maybeExpire(validityDate: Date | null, status: BudgetStatus) {
  if (!validityDate || isClosed(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return validityDate < today;
}
