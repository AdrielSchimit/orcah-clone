import { NextResponse } from "next/server";
import { listSubscriptionPayments } from "@/lib/asaas";
import { applyAsaasPayment } from "@/lib/asaas-billing";
import { latestPaidPayment } from "@/lib/checkout-safety";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { ensureSubscription, planView } from "@/lib/plan";

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const subscription = await ensureSubscription(auth.company.id);
  if (subscription.providerSubscriptionId && (!planView(subscription).ok || subscription.status === "trialing")) {
    try {
      // Only a confirmed payment can unlock the plan here; cancellations and refunds come from the webhook.
      const payments = await listSubscriptionPayments(subscription.providerSubscriptionId);
      const payment = latestPaidPayment(payments.items);
      if (payment) await applyAsaasPayment(payment);
    } catch {
      // O webhook confirma quando o site estiver público; aqui só tenta o Pix local.
    }
  }

  const fresh = await prisma.subscription.findUnique({ where: { companyId: auth.company.id } });
  const plan = planView(fresh ?? subscription);
  return NextResponse.json({
    ok: plan.ok,
    kind: plan.kind,
    paid: plan.kind === "active",
    label: plan.label,
    billingStatus: (fresh ?? subscription).status,
  }, { headers: { "Cache-Control": "no-store" } });
}
