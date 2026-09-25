import type { BudgetStatus, Prisma } from "@prisma/client";

export const BUDGET_LIST_LIMIT = 100;

export const budgetStatuses: BudgetStatus[] = [
  "draft",
  "sent",
  "viewed",
  "waiting",
  "approved",
  "rejected",
  "expired",
];

export const budgetPeriods = {
  todos: { label: "Todos", days: 0 },
  "7d": { label: "Últimos 7 dias", days: 7 },
  "30d": { label: "Últimos 30 dias", days: 30 },
} as const;

export const budgetSorts = {
  recentes: "Mais recentes",
  antigos: "Mais antigos",
  "maior-valor": "Maior valor",
  "menor-valor": "Menor valor",
} as const;

export type BudgetPeriod = keyof typeof budgetPeriods;
export type BudgetSort = keyof typeof budgetSorts;

export type BudgetListFilters = {
  q: string;
  status: BudgetStatus | null;
  period: BudgetPeriod;
  sort: BudgetSort;
};

type RawParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseBudgetListFilters(params: RawParams): BudgetListFilters {
  const status = single(params.status);
  const period = single(params.periodo);
  const sort = single(params.ordem);
  return {
    q: single(params.q).slice(0, 80),
    status: budgetStatuses.includes(status as BudgetStatus) ? (status as BudgetStatus) : null,
    period: period in budgetPeriods ? (period as BudgetPeriod) : "todos",
    sort: sort in budgetSorts ? (sort as BudgetSort) : "recentes",
  };
}

export function hasActiveFilters(filters: BudgetListFilters) {
  return Boolean(filters.q || filters.status || filters.period !== "todos");
}

/**
 * Filtro da lista de orçamentos. O companyId vem sempre da sessão e é
 * aplicado no nível de cima do AND, então nenhum filtro da URL consegue
 * escapar da empresa logada.
 */
export function budgetListWhere(
  companyId: number,
  filters: BudgetListFilters,
  now = new Date(),
): Prisma.BudgetWhereInput {
  const and: Prisma.BudgetWhereInput[] = [];

  if (filters.status) and.push({ status: filters.status });

  const days = budgetPeriods[filters.period].days;
  if (days) and.push({ updatedAt: { gte: new Date(now.getTime() - days * 86_400_000) } });

  if (filters.q) {
    const digits = filters.q.replace(/\D/g, "");
    const or: Prisma.BudgetWhereInput[] = [
      { number: { contains: filters.q, mode: "insensitive" } },
      { customer: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
    // Telefone é guardado só com dígitos; "(49) 9999" também deve achar.
    if (digits.length >= 3) or.push({ customer: { phone: { contains: digits } } });
    and.push({ OR: or });
  }

  return { companyId, ...(and.length ? { AND: and } : {}) };
}

export function budgetListOrderBy(sort: BudgetSort): Prisma.BudgetOrderByWithRelationInput[] {
  switch (sort) {
    case "antigos":
      return [{ updatedAt: "asc" }, { id: "asc" }];
    case "maior-valor":
      return [{ total: "desc" }, { updatedAt: "desc" }];
    case "menor-valor":
      return [{ total: "asc" }, { updatedAt: "desc" }];
    default:
      return [{ updatedAt: "desc" }, { id: "desc" }];
  }
}

export function budgetListHref(filters: BudgetListFilters, patch: Partial<BudgetListFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.period !== "todos") params.set("periodo", next.period);
  if (next.sort !== "recentes") params.set("ordem", next.sort);
  const query = params.toString();
  return query ? `/painel/orcamentos?${query}` : "/painel/orcamentos";
}

export function customerSummary(budgets: { status: string; total: { toString(): string } | number }[]) {
  return {
    count: budgets.length,
    total: Math.round(budgets.reduce((sum, budget) => sum + Number(budget.total), 0) * 100) / 100,
    approved: budgets.filter((budget) => budget.status === "approved").length,
  };
}

export type CustomerInput = {
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  notes?: string;
  stateId?: number | string;
  cityId?: number | string;
};

/** Valida e normaliza os campos do cliente. Mesmas regras do cadastro. */
export function parseCustomerInput(body: CustomerInput) {
  const name = body.name?.trim() ?? "";
  const phone = body.phone?.replace(/\D/g, "") ?? "";
  const stateId = body.stateId ? Number(body.stateId) : null;
  const cityId = body.cityId ? Number(body.cityId) : null;

  if (name.length < 2) return { error: "Informe o nome do cliente." };
  if (phone.length < 8) return { error: "Informe o telefone do cliente." };
  if ((stateId && !cityId) || (cityId && !stateId)) return { error: "Escolha estado e cidade juntos." };

  return {
    data: {
      name,
      phone,
      whatsapp: body.whatsapp?.replace(/\D/g, "") || phone,
      email: body.email?.trim().toLowerCase() || null,
      address: body.address?.trim() || null,
      neighborhood: body.neighborhood?.trim() || null,
      notes: body.notes?.trim() || null,
      stateId,
      cityId,
    },
  };
}

type CustomerDb = {
  customer: {
    updateMany(args: {
      where: { id: number; companyId: number };
      data: Prisma.CustomerUncheckedUpdateManyInput;
    }): Promise<{ count: number }>;
  };
};

/**
 * Atualiza o cliente da empresa. updateMany com companyId no where garante
 * que um ID de outra empresa não altera nada (count 0) e nunca cria registro.
 */
export async function updateCompanyCustomer(
  db: CustomerDb,
  companyId: number,
  customerId: number,
  data: Prisma.CustomerUncheckedUpdateManyInput,
) {
  if (!Number.isInteger(customerId) || customerId <= 0) return false;
  const result = await db.customer.updateMany({ where: { id: customerId, companyId }, data });
  return result.count === 1;
}

export function customerBudgetsWhere(companyId: number, customerId: number): Prisma.BudgetWhereInput {
  return { companyId, customerId };
}

const TIME_ZONE = "America/Sao_Paulo";

function dayKey(date: Date) {
  return date.toLocaleDateString("pt-BR", { timeZone: TIME_ZONE });
}

/** "hoje, 14:32", "ontem, 09:10" ou "12/09/2026". Sempre no fuso de Brasília. */
export function formatUpdatedAt(value: Date | string, now = new Date()) {
  const date = new Date(value);
  const time = date.toLocaleTimeString("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
  if (dayKey(date) === dayKey(now)) return `hoje, ${time}`;
  if (dayKey(date) === dayKey(new Date(now.getTime() - 86_400_000))) return `ontem, ${time}`;
  return dayKey(date);
}

export function parseId(value: string | string[] | undefined) {
  const id = Number(single(value));
  return Number.isInteger(id) && id > 0 ? id : null;
}
