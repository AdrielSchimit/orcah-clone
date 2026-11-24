import { getSubscription, listCustomerSubscriptions } from "@/lib/asaas";
import {
  CHECKOUT_CARD,
  CHECKOUT_PIX,
  claimIsStale,
  isCheckoutMarker,
  markerMethod,
  reconcileClaim,
  type CheckoutMethod,
} from "@/lib/checkout-safety";
import { prisma } from "@/lib/db";

// Persist the claim BEFORE the remote create. Ambiguous failures must be reconciled
// with Asaas (never silently retried), otherwise a second recurring charge can be created.
export async function claimCheckout(companyId: number, type: CheckoutMethod) {
  const marker = type === "PIX" ? CHECKOUT_PIX : CHECKOUT_CARD;
  const claim = await prisma.subscription.updateMany({
    where: { companyId, providerSubscriptionId: null, OR: [{ billingType: null }, { billingType: { notIn: [CHECKOUT_PIX, CHECKOUT_CARD] } }] },
    data: { billingType: marker },
  });
  return claim.count === 1 ? marker : null;
}

/** Clears a claim only while no remote subscription was recorded (and, if given, the row is unchanged). */
export async function releaseUnsentCheckout(companyId: number, marker: string, updatedAt?: Date) {
  const result = await prisma.subscription.updateMany({
    where: { companyId, billingType: marker, providerSubscriptionId: null, ...(updatedAt ? { updatedAt } : {}) },
    data: { billingType: null },
  });
  return result.count === 1;
}

export async function adoptRemoteSubscription(companyId: number, marker: string, subscriptionId: string, method: CheckoutMethod, updatedAt?: Date) {
  const result = await prisma.subscription.updateMany({
    where: { companyId, billingType: marker, providerSubscriptionId: null, ...(updatedAt ? { updatedAt } : {}) },
    data: { provider: "asaas", providerSubscriptionId: subscriptionId, billingType: method },
  });
  return result.count === 1;
}

/**
 * Asks Asaas which subscriptions this customer has and resolves the claim only when the answer is unambiguous:
 * nothing live → release; exactly one live of the claimed method → adopt; anything else → keep blocked.
 */
export async function reconcileClaimWithAsaas(companyId: number, marker: string, customerId: string, updatedAt?: Date) {
  const method = markerMethod(marker);
  if (!method) return "kept" as const;
  const listed = await listCustomerSubscriptions(customerId);
  const decision = reconcileClaim(listed.items, listed.complete, method);
  if (decision.action === "release") {
    return (await releaseUnsentCheckout(companyId, marker, updatedAt)) ? ("released" as const) : ("kept" as const);
  }
  if (decision.action === "adopt") {
    return (await adoptRemoteSubscription(companyId, marker, decision.subscriptionId, method, updatedAt))
      ? ("adopted" as const)
      : ("kept" as const);
  }
  return "kept" as const;
}

type ClaimRow = {
  companyId: number;
  billingType: string | null;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  updatedAt: Date;
};

/**
 * Recovery for a claim left behind by a timeout or crash. Only claims older than STALE_CLAIM_MS are touched,
 * so a slow remote create still in flight has had time to land. Returns the fresh row, or null when nothing changed.
 */
export async function recoverStaleCheckout(row: ClaimRow, now = new Date()) {
  if (!isCheckoutMarker(row.billingType) || row.providerSubscriptionId || !claimIsStale(row.updatedAt, now)) return null;
  try {
    // providerCustomerId is persisted before the remote create; without it, the create never started.
    const outcome = row.providerCustomerId
      ? await reconcileClaimWithAsaas(row.companyId, row.billingType, row.providerCustomerId, row.updatedAt)
      : (await releaseUnsentCheckout(row.companyId, row.billingType, row.updatedAt)) ? "released" : "kept";
    if (outcome === "kept") return null;
    return prisma.subscription.findUnique({ where: { companyId: row.companyId } });
  } catch {
    // Asaas unreachable: stay blocked rather than risk a second subscription.
    return null;
  }
}

/**
 * A payment webhook may arrive before the route persisted the new subscription ID.
 * Adopt it only if this customer has an in-flight claim and Asaas confirms the subscription is live and of the claimed method.
 */
export async function adoptSubscriptionFromWebhook(customerId: string, subscriptionId: string) {
  const pending = await prisma.subscription.findFirst({
    where: { providerCustomerId: customerId, providerSubscriptionId: null, billingType: { in: [CHECKOUT_PIX, CHECKOUT_CARD] } },
    select: { companyId: true, billingType: true },
  });
  const method = markerMethod(pending?.billingType);
  if (!pending?.billingType || !method) return false;
  const remote = await getSubscription(subscriptionId);
  if (remote.id !== subscriptionId || remote.deleted === true || remote.billingType !== method || remote.customer !== customerId) return false;
  return adoptRemoteSubscription(pending.companyId, pending.billingType, subscriptionId, method);
}
