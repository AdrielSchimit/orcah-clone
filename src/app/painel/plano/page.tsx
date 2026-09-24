import { PlanCheckout } from "@/components/plan-checkout";
import { isPreviewAdmin } from "@/lib/admin";
import { asaasConfigured } from "@/lib/asaas";
import { PLAN_PRICE_LABEL } from "@/lib/plan-constants";
import { ensureSubscription, planView } from "@/lib/plan";
import { getSessionUser } from "@/lib/session";

export default async function PlanoPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const admin = isPreviewAdmin(user);
  const subscription = await ensureSubscription(user.company.id);
  const plan = planView(subscription, { isAdmin: admin });

  if (admin) {
    return (
      <>
        <h1 className="mb-2 text-xl font-semibold">Plano</h1>
        <section className="rounded-box border border-line bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Conta de análise</p>
          <p className="mt-1 text-2xl font-semibold">{plan.label}</p>
          <p className="mt-3 text-sm text-text-soft">{plan.detail}</p>
          <ul className="mt-4 space-y-1 text-sm text-text">
            <li>Sem trial e sem cobrança nesta conta</li>
            <li>Troca de molde por ramo, inclusive Outro</li>
            <li>Orçamentos e PDFs ficam só nessa empresa</li>
          </ul>
        </section>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-xl font-semibold">Plano</h1>
      <p className="mb-5 text-sm text-text-soft">Um plano só. {PLAN_PRICE_LABEL}. Sem tabela confusa.</p>

      <section className="overflow-hidden rounded-box border border-line bg-card">
        <div className="bg-brand-wash px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Plano único</p>
          <p className="mt-1 text-[28px] font-semibold leading-8">
            R$ 29<span className="text-base font-medium text-text-soft">/mês</span>
          </p>
        </div>
        <div className="p-5">
        <p className="text-sm font-medium">{plan.label}</p>
        <p className="text-sm text-text-soft">{plan.detail}</p>
        <ul className="mt-4 space-y-1 text-sm text-text">
          <li>Orçamentos e clientes ilimitados</li>
          <li>Link público + WhatsApp</li>
          <li>PDF profissional</li>
          <li>Página da empresa na bio</li>
          <li>App na tela inicial (PWA)</li>
        </ul>
        {plan.kind === "active" ? (
          <p className="mt-5 text-sm text-ok">Plano ativo. Obrigado.</p>
        ) : asaasConfigured() ? (
          <PlanCheckout document={user.company.document} />
        ) : (
          <p className="mt-5 text-sm text-text-soft">
            Falta a chave do Asaas no servidor para cobrar de verdade.
          </p>
        )}
        </div>
      </section>
    </>
  );
}
