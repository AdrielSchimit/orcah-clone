import Link from "next/link";
import { BudgetListFilters } from "@/components/budget-list-filters";
import { StatusPill, budgetStatusTone } from "@/components/status-pill";
import { budgetStatusLabel } from "@/lib/budget-status";
import {
  BUDGET_LIST_LIMIT,
  budgetListOrderBy,
  budgetListWhere,
  formatUpdatedAt,
  hasActiveFilters,
  parseBudgetListFilters,
} from "@/lib/crm";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { getSessionUser } from "@/lib/session";

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const companyId = user.company.id;
  const filters = parseBudgetListFilters(await searchParams);
  const filtering = hasActiveFilters(filters);

  const [budgets, companyTotal] = await Promise.all([
    prisma.budget.findMany({
      where: budgetListWhere(companyId, filters),
      orderBy: budgetListOrderBy(filters.sort),
      take: BUDGET_LIST_LIMIT,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        validityDate: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.budget.count({ where: { companyId } }),
  ]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Orçamentos</h1>
        <Link
          href="/painel/orcamentos/novo"
          className="inline-flex min-h-12 items-center rounded-btn bg-gold px-4 text-sm font-semibold text-ink hover:bg-gold-press"
        >
          + Novo orçamento
        </Link>
      </div>

      {companyTotal === 0 ? (
        <div className="rounded-box border border-line bg-card p-6 text-center">
          <p className="font-semibold">Nenhum orçamento ainda.</p>
          <p className="mt-1 text-sm text-text-soft">Crie seu primeiro orçamento e acompanhe tudo por aqui.</p>
          <Link
            href="/painel/orcamentos/novo"
            className="mt-4 inline-flex min-h-12 items-center rounded-btn bg-gold px-5 font-semibold text-ink hover:bg-gold-press"
          >
            Criar orçamento
          </Link>
        </div>
      ) : (
        <>
          <BudgetListFilters filters={filters} statusLabels={budgetStatusLabel} />

          {budgets.length === 0 ? (
            <div className="rounded-box border border-line bg-card p-6 text-center">
              <p className="text-sm text-text-soft">Nenhum orçamento encontrado com esses filtros.</p>
              <Link
                href="/painel/orcamentos"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-gold-deep"
              >
                Limpar filtros
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-2 text-xs text-text-soft">
                {budgets.length === BUDGET_LIST_LIMIT
                  ? `Mostrando os ${BUDGET_LIST_LIMIT} primeiros. Refine a busca para achar outros.`
                  : `${budgets.length} ${budgets.length === 1 ? "orçamento" : "orçamentos"}${filtering ? " encontrados" : ""}`}
              </p>

              <div className="hidden grid-cols-[9rem_minmax(0,1fr)_7.5rem_8rem_8rem] gap-3 px-4 pb-2 text-xs font-medium uppercase tracking-[0.04em] text-text-soft lg:grid">
                <span>Número</span>
                <span>Cliente</span>
                <span>Status</span>
                <span className="text-right">Valor</span>
                <span className="text-right">Atualizado</span>
              </div>

              <ul className="space-y-2">
                {budgets.map((budget) => (
                  <li key={budget.id}>
                    <Link
                      href={`/painel/orcamentos/${budget.id}`}
                      className="block rounded-box border border-line bg-card p-4 hover:border-ink-line lg:grid lg:grid-cols-[9rem_minmax(0,1fr)_7.5rem_8rem_8rem] lg:items-center lg:gap-3 lg:py-3"
                    >
                      <div className="flex items-center justify-between gap-3 lg:contents">
                        <span className="text-sm text-text-soft lg:truncate">{budget.number}</span>
                        <span className="lg:order-1">
                          <StatusPill tone={budgetStatusTone(budget.status)}>
                            {budgetStatusLabel[budget.status]}
                          </StatusPill>
                        </span>
                      </div>
                      <p className="mt-2 truncate font-medium lg:mt-0">{budget.customer.name}</p>
                      <p className="mt-1 font-semibold lg:order-2 lg:mt-0 lg:text-right">
                        {formatBRL(Number(budget.total))}
                      </p>
                      <p className="mt-2 text-xs text-text-soft lg:order-3 lg:mt-0 lg:text-right">
                        <span className="lg:hidden">Atualizado </span>
                        {formatUpdatedAt(budget.updatedAt)}
                        {budget.validityDate && budget.status !== "approved" && budget.status !== "rejected" ? (
                          <span className="block lg:hidden">
                            Válido até {budget.validityDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                          </span>
                        ) : null}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  );
}
