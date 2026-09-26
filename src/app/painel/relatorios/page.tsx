import Link from "next/link";
import { loadReport, parsePeriod, REPORT_PERIODS } from "@/lib/business-metrics";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { getSessionUser } from "@/lib/session";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-box border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold leading-8">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-text-soft">{hint}</p> : null}
    </div>
  );
}

function ViewsChart({ series }: { series: { date: string; views: number }[] }) {
  const max = Math.max(1, ...series.map((point) => point.views));
  const width = 300;
  const height = 96;
  const gap = series.length > 40 ? 0.6 : 2;
  const bar = width / series.length - gap;
  const first = series[0]?.date.slice(5).split("-").reverse().join("/");
  const last = series[series.length - 1]?.date.slice(5).split("-").reverse().join("/");
  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-28 w-full"
        role="img"
        aria-label={`Acessos por dia, máximo de ${max} em um dia`}
      >
        {series.map((point, index) => {
          const h = point.views === 0 ? 1.5 : Math.max(3, (point.views / max) * (height - 4));
          return (
            <rect
              key={point.date}
              x={index * (bar + gap)}
              y={height - h}
              width={Math.max(bar, 0.8)}
              height={h}
              rx={bar > 4 ? 2 : 0}
              className={point.views === 0 ? "fill-paper-alt" : "fill-gold"}
            >
              <title>{`${point.date.split("-").reverse().join("/")}: ${point.views} ${point.views === 1 ? "acesso" : "acessos"}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-text-soft">
        <span>{first}</span>
        <span>máx. {max}/dia</span>
        <span>{last}</span>
      </figcaption>
    </figure>
  );
}

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const days = parsePeriod((await searchParams).periodo);
  const { summary, series, cities } = await loadReport(prisma, user.company.id, days);
  const maxCity = cities[0]?.[1].count ?? 1;

  const funnel = [
    { label: summary.views === 1 ? "acesso à página" : "acessos à página", value: summary.views },
    { label: summary.quoteRequests === 1 ? "pedido recebido" : "pedidos recebidos", value: summary.quoteRequests },
    { label: summary.budgetsCreated === 1 ? "orçamento criado" : "orçamentos criados", value: summary.budgetsCreated },
    { label: summary.approvedCount === 1 ? "aprovado" : "aprovados", value: summary.approvedCount },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold">Relatórios</h1>
      <p className="mb-4 text-sm text-text-soft">Como seu negócio andou no período.</p>

      <nav aria-label="Período" className="mb-5 grid grid-cols-3 gap-1 rounded-btn border border-line bg-card p-1">
        {REPORT_PERIODS.map((period) => (
          <Link
            key={period}
            href={`/painel/relatorios?periodo=${period}`}
            aria-current={period === days ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-[10px] text-sm font-medium ${
              period === days ? "bg-ink text-ink-text" : "text-text-soft"
            }`}
          >
            {period} dias
          </Link>
        ))}
      </nav>

      <section className="mb-5 rounded-box border border-line bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Acessos à página</h2>
          <span className="text-2xl font-semibold">{summary.views}</span>
        </div>
        <ViewsChart series={series} />
        <p className="mt-2 text-xs text-text-soft">
          Cada abertura da página conta como um acesso (atualizar conta de novo). Suas próprias visitas não entram.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Cliques no WhatsApp" value={String(summary.whatsappClicks)} />
        <Stat label="Pedidos recebidos" value={String(summary.quoteRequests)} />
        <Stat label="Orçamentos criados" value={String(summary.budgetsCreated)} hint={`${summary.budgetsSent} enviados`} />
        <Stat label="Aprovados" value={String(summary.approvedCount)} />
        <Stat label="Valor aprovado" value={formatBRL(summary.approvedTotal)} />
        <Stat
          label="Taxa de aprovação"
          value={summary.approvalRate === null ? "—" : `${summary.approvalRate}%`}
          hint="dos enviados no período"
        />
      </section>

      <section className="mt-5 rounded-box border border-line bg-card p-4">
        <h2 className="font-semibold">Visão geral do período</h2>
        <ol className="mt-3 flex flex-col items-stretch gap-1">
          {funnel.map((step, index) => (
            <li key={step.label} className="flex flex-col items-center">
              {index > 0 ? (
                <span aria-hidden className="text-text-soft">
                  ↓
                </span>
              ) : null}
              <span className="flex w-full items-baseline justify-center gap-2 rounded-btn bg-paper px-4 py-2.5">
                <span className="text-xl font-semibold">{step.value}</span>
                <span className="text-sm text-text-soft">{step.label}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-text-soft">
          Números do mesmo período, lado a lado. Nem todo orçamento vem da página, então isso não é uma taxa de conversão.
        </p>
      </section>

      {cities.length > 0 ? (
        <section className="mt-5 rounded-box border border-line bg-card p-4">
          <h2 className="mb-3 font-semibold">Orçamentos por cidade</h2>
          <ul className="space-y-2 text-sm">
            {cities.map(([city, data]) => (
              <li key={city}>
                <div className="mb-1 flex justify-between gap-3">
                  <span className="text-text-soft">
                    {city} · {data.count}
                  </span>
                  <span className="font-semibold">{formatBRL(data.total)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(12, (data.count / maxCity) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
