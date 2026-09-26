import Link from "next/link";
import { CreateBudgetCta } from "@/components/create-budget-cta";
import { MascoteVazio } from "@/components/mascote";
import { StatusPill, budgetStatusTone } from "@/components/status-pill";
import { isPreviewAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { budgetStatusLabel } from "@/lib/budget-status";
import { ramoLabel } from "@/lib/company-display";
import { formatBRL } from "@/lib/money";
import { getSessionUser } from "@/lib/session";

export default async function PainelPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [budgets, monthBudgets] = await Promise.all([
    prisma.budget.findMany({
      where: { companyId: user.company.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        customer: { select: { name: true } },
      },
    }),
    prisma.budget.findMany({
      where: { companyId: user.company.id, createdAt: { gte: monthStart } },
      select: {
        status: true,
        total: true,
        serviceCity: { select: { name: true } },
        serviceState: { select: { uf: true } },
      },
    }),
  ]);

  const sent = monthBudgets.filter((item) => item.status !== "draft").length;
  const viewed = monthBudgets.filter((item) =>
    ["viewed", "waiting", "approved", "rejected"].includes(item.status),
  ).length;
  const approved = monthBudgets.filter((item) => item.status === "approved");
  const approvedTotal = approved.reduce((sum, item) => sum + Number(item.total), 0);

  const byCity = new Map<string, { count: number; total: number }>();
  for (const item of monthBudgets) {
    if (!item.serviceCity || !item.serviceState) continue;
    const key = `${item.serviceCity.name}-${item.serviceState.uf}`;
    const current = byCity.get(key) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(item.total);
    byCity.set(key, current);
  }
  const cityRows = [...byCity.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  const maxCity = cityRows[0]?.[1].count ?? 1;
  const empty = budgets.length === 0;

  return (
    <>
      <CreateBudgetCta
        isAdmin={isPreviewAdmin(user)}
        currentRamoId={user.company.businessCategoryId}
        currentRamoName={ramoLabel(user.company)}
      />

      {empty ? (
        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <Step n="1" title="Monte" text="Toque em criar e escolha o serviço." />
          <Step n="2" title="Mande no WhatsApp" text="O cliente abre o link no celular." />
          <Step n="3" title="Receba a resposta" text="Aprovado, recusado ou alteração." />
        </section>
      ) : (
        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon="↑" label="Enviados no mês" value={String(sent)} />
          <Stat icon="◉" label="Visualizados" value={String(viewed)} />
          <Stat icon="✓" label="Aprovados" value={String(approved.length)} />
          <Stat icon="R$" label="Total aprovado" value={formatBRL(approvedTotal)} featured />
        </section>
      )}

      {cityRows.length > 0 ? (
        <section className="mt-5 rounded-box border border-line bg-card p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">
            Por cidade neste mês
          </h2>
          <ul className="space-y-2 text-sm">
            {cityRows.map(([city, data]) => (
              <li key={city}>
                <div className="mb-1 flex justify-between gap-3">
                  <span className="text-text-soft">
                    {city} · {data.count}
                  </span>
                  <span className="font-semibold">{formatBRL(data.total)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.max(12, (data.count / maxCity) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">
          Últimos orçamentos
        </h2>
        {empty ? (
          <>
            <p className="text-sm text-text-soft">Nenhum ainda. Monte o primeiro em um minuto.</p>
            <MascoteVazio
              pose="boas-vindas"
              action={
                <Link href="/painel/orcamentos/novo" className="text-gold-deep underline underline-offset-4">
                  Criar agora
                </Link>
              }
            >
              Vamos montar seu primeiro orçamento?
            </MascoteVazio>
          </>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {budgets.map((budget) => (
              <li key={budget.id}>
                <Link
                  href={`/painel/orcamentos/${budget.id}`}
                  className="block rounded-box border border-line bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{budget.customer.name}</p>
                      <p className="text-sm text-text-soft">{budget.number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatBRL(Number(budget.total))}</p>
                      <div className="mt-1">
                        <StatusPill tone={budgetStatusTone(budget.status)}>
                          {budgetStatusLabel[budget.status]}
                        </StatusPill>
                      </div>
                    </div>
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

function Stat({
  icon,
  label,
  value,
  featured,
}: {
  icon: string;
  label: string;
  value: string;
  featured?: boolean;
}) {
  return (
    <div className="rounded-box border border-line bg-card p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-wash text-sm text-gold-deep">
        {icon}
      </span>
      <p className={`mt-3 text-[28px] font-semibold leading-8 ${featured ? "text-gold-deep" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">{label}</p>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="rounded-box border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">{n}</p>
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-text-soft">{text}</p>
    </div>
  );
}
