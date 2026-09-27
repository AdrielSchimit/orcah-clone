import type { PrismaClient } from "@prisma/client";
import { dailySeries, periodStart, statDay, statsForPeriod, sumStats, type StatRow } from "@/lib/page-stats";

/**
 * Números do Início e de /painel/relatorios, sempre de dados reais da empresa.
 * O dia é o de São Paulo (UTC-3, sem horário de verão desde 2019).
 */

export type MetricsDb = Pick<PrismaClient, "companyPageDailyStat" | "quoteRequest" | "budget">;

export const REPORT_PERIODS = [7, 30, 90] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

const SP_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parsePeriod(value: unknown): ReportPeriod {
  const days = Number(value);
  return (REPORT_PERIODS as readonly number[]).includes(days) ? (days as ReportPeriod) : 30;
}

/** Instante em que começa (00:00 de São Paulo) a janela de N dias que termina hoje. */
export function periodStartInstant(days: number, now = new Date()) {
  return new Date(periodStart(days, now).getTime() + SP_OFFSET_MS);
}

export function monthStartInstant(now = new Date()) {
  const today = statDay(now);
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1) + SP_OFFSET_MS);
}

type BudgetRow = { status: string; total: unknown; serviceCity?: { name: string } | null; serviceState?: { uf: string } | null };

export function summarizePeriod({
  stats,
  quoteRequests,
  budgets,
  approvedCount,
  approvedTotal,
}: {
  stats: StatRow[];
  quoteRequests: number;
  budgets: BudgetRow[];
  approvedCount: number;
  approvedTotal: number;
}) {
  const page = sumStats(stats);
  const sent = budgets.filter((budget) => budget.status !== "draft");
  const approvedOfSent = sent.filter((budget) => budget.status === "approved").length;
  return {
    ...page,
    quoteRequests,
    budgetsCreated: budgets.length,
    budgetsSent: sent.length,
    approvedCount,
    approvedTotal,
    // dos orçamentos criados e enviados no período, quantos já foram aprovados
    approvalRate: sent.length > 0 ? Math.round((approvedOfSent / sent.length) * 100) : null,
  };
}

export function cityBreakdown(budgets: BudgetRow[], limit = 5) {
  const byCity = new Map<string, { count: number; total: number }>();
  for (const budget of budgets) {
    if (!budget.serviceCity || !budget.serviceState) continue;
    const key = `${budget.serviceCity.name}-${budget.serviceState.uf}`;
    const current = byCity.get(key) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(budget.total);
    byCity.set(key, current);
  }
  return [...byCity.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, limit);
}

export async function loadReport(db: MetricsDb, companyId: number, days: ReportPeriod, now = new Date()) {
  const since = periodStartInstant(days, now);
  const [stats, quoteRequests, budgets, approved] = await Promise.all([
    statsForPeriod(db, companyId, days, now),
    db.quoteRequest.count({ where: { companyId, createdAt: { gte: since } } }),
    db.budget.findMany({
      where: { companyId, createdAt: { gte: since } },
      select: {
        status: true,
        total: true,
        serviceCity: { select: { name: true } },
        serviceState: { select: { uf: true } },
      },
    }),
    db.budget.aggregate({
      where: { companyId, status: "approved", approvedAt: { gte: since } },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  return {
    days,
    summary: summarizePeriod({
      stats,
      quoteRequests,
      budgets,
      approvedCount: approved._count._all,
      approvedTotal: Number(approved._sum.total ?? 0),
    }),
    series: dailySeries(stats, days, now),
    cities: cityBreakdown(budgets),
  };
}

/** Cards do Início: acessos 7 dias (e a semana anterior), pedidos 30 dias, orçamentos e aprovados do mês. */
export async function loadDashboard(db: MetricsDb, companyId: number, now = new Date()) {
  const monthStart = monthStartInstant(now);
  const since30 = periodStartInstant(30, now);
  const [stats14, quoteRequests30, budgetsMonth, approvedMonth] = await Promise.all([
    statsForPeriod(db, companyId, 14, now),
    db.quoteRequest.count({ where: { companyId, createdAt: { gte: since30 } } }),
    db.budget.count({ where: { companyId, createdAt: { gte: monthStart } } }),
    db.budget.aggregate({
      where: { companyId, status: "approved", approvedAt: { gte: monthStart } },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  const cut = periodStart(7, now).getTime();
  const thisWeek = sumStats(stats14.filter((row) => row.date.getTime() >= cut));
  const lastWeek = sumStats(stats14.filter((row) => row.date.getTime() < cut && row.date.getTime() >= cut - 7 * DAY_MS));

  return {
    views7: thisWeek.views,
    viewsDelta: thisWeek.views - lastWeek.views,
    whatsapp7: thisWeek.whatsappClicks,
    quoteRequests30,
    budgetsMonth,
    approvedMonth: approvedMonth._count._all,
    approvedMonthTotal: Number(approvedMonth._sum.total ?? 0),
  };
}
