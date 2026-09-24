import { prisma } from "@/lib/db";
import { PLAN_PRICE } from "@/lib/plan-constants";
import { type AsaasPayment, paymentIsOverdue, paymentIsPaid } from "@/lib/asaas";

export async function markPaid(input: {
  companyId: number;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  providerPaymentId?: string | null;
  billingType?: string | null;
  dueDate?: string | null;
}) {
  const startsAt = new Date();
  const endsAt = input.dueDate ? new Date(`${input.dueDate}T23:59:59`) : new Date(startsAt);
  if (!input.dueDate) endsAt.setDate(endsAt.getDate() + 35);
  else endsAt.setDate(endsAt.getDate() + 35);

  return prisma.subscription.update({
    where: { companyId: input.companyId },
    data: {
      status: "active",
      provider: "asaas",
      plan: "unico",
      amount: PLAN_PRICE,
      startsAt,
      endsAt,
      providerCustomerId: input.providerCustomerId ?? undefined,
      providerSubscriptionId: input.providerSubscriptionId ?? undefined,
      providerPaymentId: input.providerPaymentId ?? undefined,
      billingType: input.billingType ?? undefined,
    },
  });
}

export async function markUnpaid(companyId: number, status: "past_due" | "canceled") {
  return prisma.subscription.update({
    where: { companyId },
    data: {
      status,
      provider: "asaas",
    },
  });
}

export async function applyAsaasPayment(payment: AsaasPayment) {
  const subscription = payment.subscription
    ? await prisma.subscription.findFirst({
        where: { providerSubscriptionId: payment.subscription },
      })
    : await prisma.subscription.findFirst({
        where: { providerPaymentId: payment.id },
      });

  if (!subscription) return null;

  if (paymentIsPaid(payment.status)) {
    return markPaid({
      companyId: subscription.companyId,
      providerSubscriptionId: payment.subscription ?? subscription.providerSubscriptionId,
      providerPaymentId: payment.id,
      billingType: subscription.billingType,
      dueDate: payment.dueDate,
    });
  }

  if (paymentIsOverdue(payment.status)) {
    return markUnpaid(subscription.companyId, payment.status === "DELETED" ? "canceled" : "past_due");
  }

  return subscription;
}
