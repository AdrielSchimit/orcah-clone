"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  budgetListHref,
  budgetPeriods,
  budgetSorts,
  budgetStatuses,
  type BudgetListFilters as Filters,
  type BudgetPeriod,
  type BudgetSort,
} from "@/lib/crm";

const selectClass = "min-h-11 w-full min-w-0 rounded-btn border border-line bg-card px-3 text-sm";

export function BudgetListFilters({
  filters,
  statusLabels,
}: {
  filters: Filters;
  statusLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);
  const [pushedQ, setPushedQ] = useState(filters.q);

  // A URL mudou por fora (ex.: "Limpar filtros"): acompanha sem atropelar a digitação.
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    if (filters.q !== pushedQ) {
      setQuery(filters.q);
      setPushedQ(filters.q);
    }
  }

  function go(patch: Partial<Filters>) {
    startTransition(() => router.replace(budgetListHref(filters, patch), { scroll: false }));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = query.trim();
      if (q === filters.q) return;
      setPushedQ(q);
      go({ q });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const chips: { value: Filters["status"]; label: string }[] = [
    { value: null, label: "Todos" },
    ...budgetStatuses.map((status) => ({ value: status, label: statusLabels[status] })),
  ];

  return (
    <div className={`mb-4 space-y-3 ${pending ? "opacity-70" : ""}`}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por cliente, número ou telefone"
        aria-label="Buscar orçamentos"
        className="w-full rounded-btn border border-line bg-card px-4 py-3"
      />

      <nav aria-label="Filtrar por status" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
          {chips.map((chip) => {
            const active = filters.status === chip.value;
            return (
              <li key={chip.label}>
                <Link
                  href={budgetListHref({ ...filters, q: query.trim() }, { status: chip.value })}
                  replace
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-medium ${
                    active ? "border-ink bg-ink text-ink-text" : "border-line bg-card text-text-soft"
                  }`}
                >
                  {chip.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid grid-cols-2 gap-2 md:flex md:justify-end">
        <label className="min-w-0 md:w-48">
          <span className="sr-only">Período</span>
          <select
            value={filters.period}
            onChange={(event) => go({ q: query.trim(), period: event.target.value as BudgetPeriod })}
            className={selectClass}
          >
            {Object.entries(budgetPeriods).map(([value, { label }]) => (
              <option key={value} value={value}>
                {value === "todos" ? "Qualquer data" : label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 md:w-48">
          <span className="sr-only">Ordenar</span>
          <select
            value={filters.sort}
            onChange={(event) => go({ q: query.trim(), sort: event.target.value as BudgetSort })}
            className={selectClass}
          >
            {Object.entries(budgetSorts).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
