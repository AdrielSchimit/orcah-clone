import Link from "next/link";
import { notFound } from "next/navigation";
import { BudgetForm } from "@/components/budget-form";
import { BudgetPhotosForm } from "@/components/budget-photos-form";
import { CopyLinkButton } from "@/components/copy-link-button";
import { SendWhatsAppButton } from "@/components/send-whatsapp-button";
import { StatusPill, budgetStatusTone } from "@/components/status-pill";
import { groupedItems } from "@/lib/budget";
import { prisma } from "@/lib/db";
import { budgetStatusLabel } from "@/lib/budget-status";
import { formatDateTime } from "@/lib/date";
import { formatBRL, moneyString } from "@/lib/money";
import { getSessionUser } from "@/lib/session";
import { companyTemplate, KIND_LABEL, itemDetailLines, parseExtras, type ItemKind } from "@/lib/templates";
import { budgetPublicUrl } from "@/lib/whatsapp";

const eventLabel = {
  created: "Criado",
  sent: "Enviado no WhatsApp",
  viewed: "Cliente visualizou",
  approved: "Aprovado",
  rejected: "Recusado",
  revision_requested: "Cliente pediu alteração",
  expired: "Expirado",
};

const eventTone: Record<string, string> = {
  created: "bg-line",
  sent: "bg-wait",
  viewed: "bg-wait",
  approved: "bg-ok",
  rejected: "bg-no",
  revision_requested: "bg-wait",
  expired: "bg-line",
};

export default async function OrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const id = Number((await params).id);
  const budget = await prisma.budget.findFirst({
    where: { id, companyId: user.company.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      serviceCity: { select: { name: true } },
      serviceState: { select: { uf: true } },
      events: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });

  if (!budget) notFound();

  const publicUrl = budgetPublicUrl(budget.publicToken);
  const canEdit = budget.status === "draft" || budget.status === "waiting";
  const template = companyTemplate(user.company);
  const extras = parseExtras(budget.extras);
  const revision = budget.events.find((event) => event.event === "revision_requested");
  const revisionMessage =
    revision && revision.metadata && typeof revision.metadata === "object" && "message" in revision.metadata
      ? String((revision.metadata as { message?: string }).message ?? "")
      : "";

  return (
    <>
      <Link
        href="/painel"
        className="mb-4 inline-flex min-h-12 items-center text-sm font-medium text-text-soft"
      >
        ← Voltar
      </Link>
      <div className="mb-5 overflow-hidden rounded-box border border-line bg-card">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-text-soft">{budget.number}</p>
              <h1 className="text-xl font-semibold">{budget.customer.name}</h1>
            </div>
            <StatusPill tone={budgetStatusTone(budget.status)}>{budgetStatusLabel[budget.status]}</StatusPill>
          </div>
          {budget.viewedAt ? (
            <p className="mt-1 text-xs text-ok">Visualizado em {formatDateTime(budget.viewedAt)}</p>
          ) : null}
          {budget.serviceCity && budget.serviceState ? (
            <p className="mt-1 text-sm text-text-soft">
              Serviço em {budget.serviceCity.name} - {budget.serviceState.uf}
            </p>
          ) : null}
        </div>
        <div className="bg-brand-wash px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Total</p>
          <p className="mt-1 text-[28px] font-semibold leading-8">{formatBRL(Number(budget.total))}</p>
        </div>
      </div>

      {revisionMessage ? (
        <div className="mb-5 rounded-box border border-gold/40 bg-gold-wash p-4">
          <p className="text-sm font-semibold">Pedido de alteração</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-soft">{revisionMessage}</p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-2">
        <SendWhatsAppButton budgetId={budget.id} />
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/api/orcamentos/${budget.id}/pdf`}
            className="flex min-h-12 items-center justify-center rounded-btn border border-line bg-card px-3 text-center text-sm font-medium"
          >
            Baixar PDF
          </a>
          <CopyLinkButton url={publicUrl} />
        </div>
      </div>

      <BudgetPhotosForm
        budgetId={budget.id}
        photos={budget.photos}
        template={template}
        canEdit={canEdit}
      />

      {canEdit ? (
        <BudgetForm
          budgetId={budget.id}
          template={template}
          defaults={{
            customerId: budget.customerId,
            customerName: `${budget.customer.name} · ${budget.customer.phone}`,
            serviceStateId: budget.serviceStateId,
            serviceCityId: budget.serviceCityId,
            validityDate: budget.validityDate
              ? budget.validityDate.toISOString().slice(0, 10)
              : undefined,
            estimatedDays: budget.estimatedDays ? String(budget.estimatedDays) : undefined,
            serviceAddress: budget.serviceAddress ?? undefined,
            notes: budget.notes ?? undefined,
            discount: moneyString(Number(budget.discount)),
            discountType: budget.discountType === "percent" ? "percent" : "amount",
            discountValue: moneyString(Number(budget.discountValue)),
            paymentMethod:
              budget.paymentMethod === "card" ||
              budget.paymentMethod === "boleto" ||
              budget.paymentMethod === "cash" ||
              budget.paymentMethod === "transfer" ||
              budget.paymentMethod === "pix"
                ? budget.paymentMethod
                : "pix",
            acceptedPaymentMethods: Array.isArray(budget.acceptedPaymentMethods)
              ? budget.acceptedPaymentMethods.filter(
                  (method): method is "pix" | "card" | "boleto" | "cash" | "transfer" =>
                    method === "pix" ||
                    method === "card" ||
                    method === "boleto" ||
                    method === "cash" ||
                    method === "transfer",
                )
              : undefined,
            paymentCondition:
              budget.paymentCondition === "deposit_balance" ||
              budget.paymentCondition === "installments_2" ||
              budget.paymentCondition === "installments_3" ||
              budget.paymentCondition === "custom" ||
              budget.paymentCondition === "cash"
                ? budget.paymentCondition
                : "cash",
            downPaymentType: budget.downPaymentType === "amount" || budget.downPaymentType === "percent"
              ? budget.downPaymentType
              : undefined,
            downPaymentValue: moneyString(Number(budget.downPaymentValue)),
            extras,
            items: budget.items.map((item) => ({
              description: item.description,
              quantity: moneyString(Number(item.quantity)),
              unit: item.unit,
              unitPrice: moneyString(Number(item.unitPrice)),
              discount: moneyString(Number(item.discount)),
              kind: item.kind ?? "",
              groupName: item.groupName ?? "",
              notes: item.notes ?? "",
              material: item.material ?? "",
              deadline: item.deadline ?? "",
              length: item.length ?? "",
              width: item.width ?? "",
              height: item.height ?? "",
              areaNote: item.areaNote ?? "",
              powerNote: item.powerNote ?? "",
              volumeNote: item.volumeNote ?? "",
            })),
          }}
        />
      ) : (
        <ul className="space-y-3">
          {groupedItems(budget.items).map((group) => (
            <li key={group.name || "itens"} className="space-y-2">
              {group.name ? <p className="text-sm font-semibold text-gold-deep">{group.name}</p> : null}
              {group.items.map((item) => (
                <div key={item.id} className="rounded-box border border-line bg-card p-4">
                  {item.kind && item.kind in KIND_LABEL ? (
                    <p className="text-xs text-text-soft">{KIND_LABEL[item.kind as ItemKind]}</p>
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
            </li>
          ))}
        </ul>
      )}

      {budget.events.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Acompanhamento</h2>
          <ul className="space-y-0">
            {budget.events.map((event) => (
              <li key={event.id} className="flex gap-3 py-2">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${eventTone[event.event] ?? "bg-line"}`} />
                <div>
                  <p className="text-sm font-medium">{eventLabel[event.event]}</p>
                  <p className="text-xs text-text-soft">{formatDateTime(event.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
