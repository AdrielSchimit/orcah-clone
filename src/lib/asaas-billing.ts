import { prisma } from "@/lib/db";
import type { AsaasPayment } from "@/lib/asaas";
import { decidePayment } from "@/lib/checkout-safety";
import { isBillingExempt } from "@/lib/plan";

/** Reconcile provider snapshots, not arrival order. No renewal from the local clock. */
export async function applyAsaasPayment(payment: AsaasPayment) {
  const subscription = payment.subscription
    ? await prisma.subscription.findFirst({ where: { providerSubscriptionId: payment.subscription } })
    : await prisma.subscription.findFirst({ where: { providerPaymentId: payment.id } });
  if (!subscription) return null;
  const company = await prisma.company.findUnique({ where: { id: subscription.companyId }, select: { userId: true } });
  if (isBillingExempt({ id: company?.userId }) || subscription.provider === "complimentary") return subscription;
  const decision = decidePayment({ ...subscription, amount: Number(subscription.amount) }, payment);
  if (!decision) return subscription;
  // Atomic conditional write; a concurrent update causes retry rather than overwrite.
  const result = await prisma.subscription.updateMany({
    where: { id: subscription.id, updatedAt: subscription.updatedAt, providerSubscriptionId: subscription.providerSubscriptionId, providerPaymentId: subscription.providerPaymentId, status: subscription.status },
    data: { status: decision.status, provider: "asaas", providerPaymentId: payment.id, ...(decision.status === "active" ? { startsAt: new Date(), endsAt: decision.endsAt } : {}) },
  });
  if (!result.count) throw new Error("Concurrent payment update; retry reconciliation.");
  return prisma.subscription.findUnique({ where: { id: subscription.id } });
}
