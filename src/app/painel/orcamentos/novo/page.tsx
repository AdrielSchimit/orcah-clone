import { AdminRamoSwitcher } from "@/components/admin-ramo-switcher";
import { BudgetForm } from "@/components/budget-form";
import { isAdmin } from "@/lib/admin";
import { ramoLabel } from "@/lib/company-display";
import { companyCustomerWhere, parseId } from "@/lib/crm";
import { prisma } from "@/lib/db";
import { contextoDoPedido } from "@/lib/pedido-orcamento";
import { formatPhoneBR } from "@/lib/phone";
import { getSessionUser } from "@/lib/session";
import { companyTemplate } from "@/lib/templates";

export default async function NovoOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user?.company) return null;
  // ?cliente=ID vindo do perfil do cliente; só vale se o cliente for desta empresa.
  const query = await searchParams;
  const customerId = parseId(query.cliente);
  const pedidoId = parseId(query.pedido);
  const pedido = pedidoId
    ? await prisma.quoteRequest.findFirst({
        where: { id: pedidoId, companyId: user.company.id },
      })
    : null;
  const pedidoPhone = pedido?.customerPhone.replace(/\D/g, "") ?? "";
  const pedidoCustomer = pedidoPhone
    ? await prisma.customer.findFirst({
        where: {
          companyId: user.company.id,
          OR: [{ phone: pedidoPhone }, { whatsapp: pedidoPhone }],
        },
        select: { id: true, name: true, phone: true },
      })
    : null;
  const customer = pedidoCustomer
    ? pedidoCustomer
    : customerId
      ? await prisma.customer.findFirst({
          where: companyCustomerWhere(user.company.id, customerId),
          select: { id: true, name: true, phone: true },
        })
      : null;
  const contexto = pedido ? contextoDoPedido(pedido) : null;
  const template = companyTemplate(user.company);
  const admin = isAdmin(user);

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">{admin ? "Criar orçamento" : template.title}</h1>
      {admin ? (
        <div className="mb-4 rounded-box border border-dashed border-ink-line bg-paper p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-text-soft">Conta de análise</p>
          <AdminRamoSwitcher
            currentRamoId={user.company.businessCategoryId}
            currentRamoName={ramoLabel(user.company)}
            afterPick="refresh"
            startOpen={false}
          />
        </div>
      ) : null}
      <BudgetForm
        key={`${user.company.businessCategoryId ?? "none"}-${user.company.customRamoName ?? ""}-${customer?.id ?? ""}-${pedido?.id ?? ""}`}
        template={template}
        defaults={{
          serviceStateId: pedido?.stateId ?? user.company.stateId,
          serviceCityId: pedido?.cityId ?? user.company.cityId,
          ...(customer
            ? { customerId: customer.id, customerName: `${customer.name} · ${formatPhoneBR(customer.phone)}` }
            : pedido
              ? { newCustomerName: pedido.customerName, newCustomerPhone: formatPhoneBR(pedido.customerPhone) }
              : {}),
          ...(contexto
            ? {
                quoteRequestId: pedido?.id,
                notes: contexto.notes,
                serviceAddress: contexto.address,
                ...(contexto.service
                  ? {
                      items: [
                        {
                          description: contexto.service,
                          quantity: "1",
                          unit: template.defaultUnit,
                        },
                      ],
                    }
                  : {}),
              }
            : {}),
        }}
      />
    </>
  );
}
