import Link from "next/link";
import { CreateBudgetCta } from "@/components/create-budget-cta";
import { MascoteAvatar, MascoteVazio } from "@/components/mascote";
import { StatusPill, budgetStatusTone } from "@/components/status-pill";
import { isPreviewAdmin } from "@/lib/admin";
import { budgetStatusLabel } from "@/lib/budget-status";
import { loadDashboard } from "@/lib/business-metrics";
import { ramoLabel } from "@/lib/company-display";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { getSessionUser } from "@/lib/session";

function greeting(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" }).format(now));
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "up" | "muted" }) {
  return (
    <div className="rounded-box border border-line bg-card p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-soft">{label}</p>
      <p className="mt-1 text-[26px] font-semibold leading-8">{value}</p>
      <p className={`mt-0.5 truncate text-xs ${tone === "up" ? "font-medium text-ok" : "text-text-soft"}`}>{detail}</p>
    </div>
  );
}

const actionIcons = {
  pagina: "M3 5h18v14H3zM3 9h18M7 13h4M7 16h7",
  servico: "M14.7 6.3a4 4 0 0 0-5.4 5.2l-5 5a1.7 1.7 0 0 0 2.4 2.4l5-5a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.6-.6-2.1z",
  relatorio: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  pedidos: "M4 13h4l1.5 3h5L16 13h4M5.5 6.5 4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5l-1.5-6.5A1 1 0 0 0 17.5 6h-11a1 1 0 0 0-1 .5z",
};

function QuickAction({ href, title, text, icon }: { href: string; title: string; text: string; icon: keyof typeof actionIcons }) {
  return (
    <Link href={href} className="flex min-h-24 flex-col rounded-box border border-line bg-card p-4 transition-colors hover:border-gold/60">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-wash text-gold-deep">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d={actionIcons[icon]} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="mt-2 font-semibold leading-snug">{title}</span>
      <span className="text-xs text-text-soft">{text}</span>
    </Link>
  );
}

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ bemvindo?: string }> }) {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const welcome = (await searchParams).bemvindo === "1";
  const companyId = user.company.id;

  const [metrics, budgets, pedidosNovos] = await Promise.all([
    loadDashboard(prisma, companyId),
    prisma.budget.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.quoteRequest.count({ where: { companyId, status: "new" } }),
  ]);

  const firstName = user.name.split(" ")[0];
  const viewsDetail =
    metrics.views7 === 0 && metrics.viewsDelta === 0
      ? "últimos 7 dias"
      : metrics.viewsDelta > 0
        ? `+${metrics.viewsDelta} vs semana anterior`
        : metrics.viewsDelta < 0
          ? `${metrics.viewsDelta} vs semana anterior`
          : "igual à semana anterior";

  return (
    <>
      {welcome ? (
        <section className="gold-edge mb-5 rounded-box border bg-card p-4">
          <p className="text-lg font-semibold">Sua empresa foi criada 🎉</p>
          <p className="mt-1 text-sm text-text-soft">Agora você pode:</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/painel/orcamentos/novo" className="flex min-h-12 items-center justify-center rounded-btn bg-gold px-3 text-sm font-semibold text-ink">
              Fazer orçamento
            </Link>
            <Link href="/painel/pagina" className="flex min-h-12 items-center justify-center rounded-btn border border-line px-3 text-sm font-semibold">
              Montar minha página
            </Link>
          </div>
        </section>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-tight">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-0.5 text-sm text-text-soft">Veja como seu negócio está indo.</p>
        </div>
        <MascoteAvatar className="h-12 w-12 shrink-0" />
      </div>

      {pedidosNovos > 0 ? (
        <Link
          href="/painel/pedidos"
          className="gold-edge mt-4 flex min-h-14 items-center justify-between gap-3 rounded-box border bg-card px-4 py-3"
        >
          <span>
            <span className="block font-semibold">
              {pedidosNovos === 1 ? "1 novo pedido" : `${pedidosNovos} novos pedidos`}
            </span>
            <span className="block text-xs text-text-soft">Responda rápido: quem chega primeiro costuma fechar.</span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-gold-deep">Ver ›</span>
        </Link>
      ) : null}

      <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Resumo">
        <Metric label="Acessos à página" value={String(metrics.views7)} detail={viewsDetail} tone={metrics.viewsDelta > 0 ? "up" : undefined} />
        <Metric label="Pedidos recebidos" value={String(metrics.quoteRequests30)} detail="últimos 30 dias" />
        <Metric label="Orçamentos" value={String(metrics.budgetsMonth)} detail="este mês" />
        <Metric
          label="Aprovados"
          value={String(metrics.approvedMonth)}
          detail={metrics.approvedMonth > 0 ? formatBRL(metrics.approvedMonthTotal) : "este mês"}
          tone={metrics.approvedMonth > 0 ? "up" : undefined}
        />
      </section>

      <div className="mt-5">
        <CreateBudgetCta
          isAdmin={isPreviewAdmin(user)}
          currentRamoId={user.company.businessCategoryId}
          currentRamoName={ramoLabel(user.company)}
        />
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Atalhos">
        <QuickAction href="/painel/pagina" title="Editar página" text="Fotos, contato e cores" icon="pagina" />
        <QuickAction href="/painel/servicos/novo" title="Cadastrar serviço" text="O que você faz" icon="servico" />
        <QuickAction href="/painel/relatorios" title="Ver relatório" text="Acessos e aprovações" icon="relatorio" />
        <QuickAction
          href="/painel/pedidos"
          title="Pedidos"
          text={pedidosNovos > 0 ? `${pedidosNovos} esperando` : "Da sua página"}
          icon="pedidos"
        />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Últimos orçamentos</h2>
          {budgets.length > 0 ? (
            <Link href="/painel/orcamentos" className="min-h-10 text-sm font-medium text-gold-deep">
              Ver todos ›
            </Link>
          ) : null}
        </div>
        {budgets.length === 0 ? (
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
                <Link href={`/painel/orcamentos/${budget.id}`} className="block rounded-box border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{budget.customer.name}</p>
                      <p className="text-sm text-text-soft">{budget.number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatBRL(Number(budget.total))}</p>
                      <div className="mt-1">
                        <StatusPill tone={budgetStatusTone(budget.status)}>{budgetStatusLabel[budget.status]}</StatusPill>
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
