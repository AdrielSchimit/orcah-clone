import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PublicBudgetActions } from "@/components/public-budget-actions";
import { PublicPhotoGallery } from "@/components/public-photo-gallery";
import { OrcahLogo } from "@/components/orcah-logo";
import { groupedItems, kindSubtotals } from "@/lib/budget";
import { ramoLabel, serviceAreaLabel } from "@/lib/company-display";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/db";
import { formatBRL, moneyString } from "@/lib/money";
import { findPublicBudget, maybeExpire } from "@/lib/public-budget";
import { companyTemplate, KIND_LABEL, extraDetailLines, itemDetailLines, parseExtras, travelFeeAmount, type ItemKind } from "@/lib/templates";
import { companyPublicUrl } from "@/lib/urls";

function serviceTitle(items: { description: string; groupName?: string | null }[]) {
  const names = [
    ...new Set(items.map((item) => item.groupName?.trim()).filter((name): name is string => Boolean(name))),
  ];
  if (names.length === 1) return names[0];
  if (items.length === 1) return items[0]?.description ?? "";
  return "";
}

function companyPlace(company: {
  address?: string | null;
  neighborhood?: string | null;
  city?: { name: string } | null;
  state?: { uf: string; name: string } | null;
}) {
  const city = company.city && company.state ? `${company.city.name}-${company.state.uf}` : company.state?.name;
  return [company.address, company.neighborhood, city].filter(Boolean).join(" · ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const budget = await prisma.budget.findUnique({
    where: { publicToken: (await params).token },
    include: { company: { select: { name: true } } },
  });
  if (!budget) return { title: "Orçamento" };
  return {
    title: `${budget.company.name} · ${budget.number}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicOrcamentoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const token = (await params).token;
  const budget = await findPublicBudget(token);
  if (!budget) notFound();

  const expired = maybeExpire(budget.validityDate, budget.status);
  const status = expired ? "expired" : budget.status;
  const template = companyTemplate(budget.company);
  const extras = parseExtras(budget.extras);
  const groups = groupedItems(budget.items);
  const kinds = kindSubtotals(budget.items);
  const photos = budget.photos;
  const title = serviceTitle(budget.items);
  const totalLabel = formatBRL(Number(budget.total));
  const travel = travelFeeAmount(extras);
  const discount = Number(budget.discount);
  const showBreakdown = kinds.some(([kind]) => kind in KIND_LABEL) || travel > 0 || discount > 0;
  const canRespond = !["approved", "rejected", "waiting", "expired"].includes(status);
  const place = companyPlace(budget.company);
  const contextLines = [
    budget.serviceCity && budget.serviceState ? `Serviço em ${budget.serviceCity.name}-${budget.serviceState.uf}` : "",
    budget.serviceAddress ?? "",
    ...extraDetailLines(extras, template.form),
    budget.estimatedDays ? `Prazo estimado: ${budget.estimatedDays} dia(s)` : "",
  ].filter(Boolean);
  const gallery = <PublicPhotoGallery photos={photos} title={template.photos.sectionTitle} />;

  return (
    <div className={`flex min-h-full w-full flex-1 flex-col bg-paper ${canRespond ? "pb-28" : ""}`}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
        <header className="flex items-center gap-3">
          {budget.company.logoPath ? (
            <Image
              src={budget.company.logoPath}
              alt={budget.company.name}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-btn object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-paper-alt text-base font-semibold text-text">
              {budget.company.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text">{budget.company.name}</p>
            <p className="truncate text-sm text-text-soft">{ramoLabel(budget.company)}</p>
            <p className="truncate text-sm text-text-soft">{serviceAreaLabel(budget.company)}</p>
          </div>
        </header>

        <section className="mt-6">
          <h1 className="text-sm font-medium text-text-soft">
            {template.publicTitle} para {budget.customer.name}
          </h1>
          {title ? <p className="mt-1 text-2xl font-semibold leading-tight text-text">{title}</p> : null}
          <p className="mt-1 text-sm text-text-soft">{budget.number}</p>
          <p className="mt-4 text-[32px] font-semibold leading-none tracking-tight text-text">{totalLabel}</p>
          {budget.validityDate ? (
            <p className="mt-2 text-sm text-text-soft">Válido até {formatDate(budget.validityDate)}</p>
          ) : null}
        </section>

        {template.photos.placement === "before-items" ? gallery : null}

        {budget.items.length > 0 ? (
          <section className="mt-6 space-y-3">
            <h2 className="px-1 text-sm font-semibold">Serviços</h2>
            {groups.map((group) => (
              <div key={group.name || "itens"} className="space-y-2">
                {group.name && group.name !== title ? (
                  <h3 className="px-1 text-sm font-semibold text-text">{group.name}</h3>
                ) : null}
                {group.items.map((item) => (
                  <div key={item.id} className="rounded-box border border-line bg-card p-4">
                    {item.kind && item.kind in KIND_LABEL ? (
                      <p className="text-xs uppercase tracking-wide text-text-soft">
                        {KIND_LABEL[item.kind as ItemKind]}
                      </p>
                    ) : null}
                    <p className="font-medium">{item.description}</p>
                    {itemDetailLines(item, {
                      depthAsLength: template.form?.itemSizeWHD,
                      materialLabel: template.form?.itemMaterialLabel,
                    }).map((line) => (
                      <p key={line} className="text-sm text-text-soft">
                        {line}
                      </p>
                    ))}
                    <p className="text-sm text-text-soft">
                      {moneyString(Number(item.quantity))} {item.unit} × {formatBRL(Number(item.unitPrice))}
                    </p>
                    <p className="mt-1 font-semibold">{formatBRL(Number(item.subtotal))}</p>
                  </div>
                ))}
                {group.name && groups.length > 1 ? (
                  <p className="px-1 text-right text-sm text-text-soft">
                    Subtotal {group.name}: {formatBRL(group.subtotal)}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {template.photos.placement === "after-items" ? gallery : null}

        {showBreakdown ? (
          <section className="mt-4 rounded-box border border-line bg-card p-4">
            {kinds.map(([kind, amount]) =>
              kind in KIND_LABEL ? (
                <p key={kind} className="flex justify-between text-sm text-text-soft">
                  <span>{KIND_LABEL[kind as ItemKind]}</span>
                  <span>{formatBRL(amount)}</span>
                </p>
              ) : null,
            )}
            <p className="flex justify-between text-sm text-text-soft">
              <span>Subtotal</span>
              <span>{formatBRL(Number(budget.subtotal))}</span>
            </p>
            {travel > 0 ? (
              <p className="flex justify-between text-sm text-text-soft">
                <span>Deslocamento</span>
                <span>{formatBRL(travel)}</span>
              </p>
            ) : null}
            {discount > 0 ? (
              <p className="flex justify-between text-sm text-text-soft">
                <span>Desconto</span>
                <span>- {formatBRL(discount)}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        {contextLines.length > 0 ? (
          <section className="mt-4 rounded-box border border-line bg-card p-4">
            {contextLines.map((line) => (
              <p key={line} className="text-sm text-text-soft">
                {line}
              </p>
            ))}
          </section>
        ) : null}

        {budget.notes ? (
          <section className="mt-4 rounded-box border border-line bg-card p-4">
            <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Observações</h2>
            <p className="whitespace-pre-wrap text-sm text-text-soft">{budget.notes}</p>
          </section>
        ) : null}

        {template.footerNote ? <p className="mt-3 px-1 text-xs text-text-soft">{template.footerNote}</p> : null}

        <div className="mt-6">
          <PublicBudgetActions token={token} initialStatus={status} totalLabel={totalLabel} />
        </div>

        <footer className="mt-8 flex flex-col items-center gap-1 pb-4 text-center text-xs text-text-soft">
          {budget.company.document ? <p>CNPJ/CPF: {budget.company.document}</p> : null}
          {place ? <p>{place}</p> : null}
          <a href={companyPublicUrl(budget.company.slug)} className="mt-2 inline-flex min-h-12 items-center text-sm font-medium text-text">
            Ver página da empresa
          </a>
          <a
            href={`/api/publico/orcamentos/${token}/pdf`}
            className="inline-flex min-h-12 items-center text-sm font-medium text-text"
          >
            Baixar PDF
          </a>
          <OrcahLogo className="mt-4 h-6 w-auto" />
          <p>Feito com Orçah</p>
        </footer>
      </div>
    </div>
  );
}
