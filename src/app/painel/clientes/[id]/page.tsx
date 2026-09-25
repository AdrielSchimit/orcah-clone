import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { StatusPill, budgetStatusTone } from "@/components/status-pill";
import { budgetStatusLabel } from "@/lib/budget-status";
import { companyCustomerWhere, customerBudgetsWhere, customerSummary, parseId } from "@/lib/crm";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { formatPhoneBR } from "@/lib/phone";
import { getSessionUser } from "@/lib/session";

export default async function ClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const id = parseId((await params).id);
  if (!id) notFound();
  const companyId = user.company.id;

  const customer = await prisma.customer.findFirst({
    where: companyCustomerWhere(companyId, id),
    include: {
      city: { select: { name: true } },
      state: { select: { uf: true } },
    },
  });
  if (!customer) notFound();

  const editing = (await searchParams).editar === "1";
  if (editing) {
    return (
      <>
        <Link
          href={`/painel/clientes/${customer.id}`}
          className="mb-4 inline-flex min-h-12 items-center text-sm font-medium text-text-soft"
        >
          ← Cancelar
        </Link>
        <CustomerForm
          customer={{
            id: customer.id,
            name: customer.name,
            phone: formatPhoneBR(customer.phone),
            // Campo é "se diferente": igual ao telefone fica vazio e o salvar repete o telefone.
            whatsapp:
              customer.whatsapp && customer.whatsapp !== customer.phone ? formatPhoneBR(customer.whatsapp) : null,
            email: customer.email,
            address: customer.address,
            neighborhood: customer.neighborhood,
            notes: customer.notes,
            stateId: customer.stateId,
            cityId: customer.cityId,
          }}
        />
      </>
    );
  }

  const where = customerBudgetsWhere(companyId, customer.id);
  const [budgets, groups] = await Promise.all([
    prisma.budget.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      select: { id: true, number: true, status: true, total: true, createdAt: true },
    }),
    prisma.budget.groupBy({ by: ["status"], where, _count: { _all: true }, _sum: { total: true } }),
  ]);
  const summary = customerSummary(groups);

  const whatsapp = customer.whatsapp && customer.whatsapp !== customer.phone ? customer.whatsapp : null;
  const place = [
    customer.address,
    customer.neighborhood,
    customer.city && customer.state ? `${customer.city.name} - ${customer.state.uf}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Link
        href="/painel/clientes"
        className="mb-4 inline-flex min-h-12 items-center text-sm font-medium text-text-soft"
      >
        ← Clientes
      </Link>

      <section className="rounded-box border border-line bg-card p-4">
        <h1 className="break-words text-xl font-semibold">{customer.name}</h1>
        <div className="mt-2 space-y-0.5 text-sm">
          <p>
            <a href={`tel:${customer.phone}`} className="font-medium">
              {formatPhoneBR(customer.phone)}
            </a>
          </p>
          {whatsapp ? <p className="text-text-soft">WhatsApp {formatPhoneBR(whatsapp)}</p> : null}
          {customer.email ? <p className="break-all text-text-soft">{customer.email}</p> : null}
          {place ? <p className="text-text-soft">{place}</p> : null}
        </div>
        {customer.notes ? (
          <p className="mt-3 whitespace-pre-wrap rounded-btn bg-paper p-3 text-sm text-text-soft">{customer.notes}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 md:flex">
          <Link
            href={`/painel/orcamentos/novo?cliente=${customer.id}`}
            className="flex min-h-12 items-center justify-center rounded-btn bg-gold px-4 text-sm font-semibold text-ink hover:bg-gold-press"
          >
            Novo orçamento
          </Link>
          <Link
            href={`/painel/clientes/${customer.id}?editar=1`}
            className="flex min-h-12 items-center justify-center rounded-btn border border-line px-4 text-sm font-semibold"
          >
            Editar cliente
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Orçamentos</h2>
        {summary.count > 0 ? (
          <p className="mb-3 text-sm text-text-soft">
            {summary.count} {summary.count === 1 ? "orçamento" : "orçamentos"} · {formatBRL(summary.total)} orçados
            {summary.approved > 0 ? ` · ${summary.approved} ${summary.approved === 1 ? "aprovado" : "aprovados"}` : ""}
          </p>
        ) : null}

        {budgets.length === 0 ? (
          <p className="text-sm text-text-soft">Nenhum orçamento para este cliente ainda.</p>
        ) : (
          <ul className="space-y-2">
            {budgets.map((budget) => (
              <li key={budget.id}>
                <Link
                  href={`/painel/orcamentos/${budget.id}`}
                  className="block rounded-box border border-line bg-card p-4 hover:border-ink-line"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-text-soft">{budget.number}</span>
                    <StatusPill tone={budgetStatusTone(budget.status)}>{budgetStatusLabel[budget.status]}</StatusPill>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{formatBRL(Number(budget.total))}</span>
                    <span className="text-xs text-text-soft">{formatDate(budget.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
