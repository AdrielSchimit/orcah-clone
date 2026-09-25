import { AdminRamoSwitcher } from "@/components/admin-ramo-switcher";
import { BudgetForm } from "@/components/budget-form";
import { isPreviewAdmin } from "@/lib/admin";
import { ramoLabel } from "@/lib/company-display";
import { companyCustomerWhere, parseId } from "@/lib/crm";
import { prisma } from "@/lib/db";
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
  const customerId = parseId((await searchParams).cliente);
  const customer = customerId
    ? await prisma.customer.findFirst({
        where: companyCustomerWhere(user.company.id, customerId),
        select: { id: true, name: true, phone: true },
      })
    : null;
  const template = companyTemplate(user.company);
  const admin = isPreviewAdmin(user);

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
        key={`${user.company.businessCategoryId ?? "none"}-${user.company.customRamoName ?? ""}-${customer?.id ?? ""}`}
        template={template}
        defaults={{
          serviceStateId: user.company.stateId,
          serviceCityId: user.company.cityId,
          ...(customer
            ? { customerId: customer.id, customerName: `${customer.name} · ${formatPhoneBR(customer.phone)}` }
            : {}),
        }}
      />
    </>
  );
}
