export const CHECKOUT_PIX = "CREATING_PIX";
export const CHECKOUT_CARD = "CREATING_CARD";
export type CheckoutMethod = "PIX" | "CREDIT_CARD";

const PAID_STATUSES = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];
const OPEN_STATUSES = ["PENDING", "OVERDUE"];

export function isCheckoutMarker(value: string | null | undefined): value is typeof CHECKOUT_PIX | typeof CHECKOUT_CARD {
  return value === CHECKOUT_PIX || value === CHECKOUT_CARD;
}

export function markerMethod(value: string | null | undefined): CheckoutMethod | null {
  if (value === CHECKOUT_PIX) return "PIX";
  if (value === CHECKOUT_CARD) return "CREDIT_CARD";
  return null;
}

export function checkoutDecision(
  row: { providerSubscriptionId: string | null; billingType: string | null; status?: string },
  type: CheckoutMethod,
) {
  if (isCheckoutMarker(row.billingType)) return "blocked";
  if (!row.providerSubscriptionId) return "create";
  // A canceled remote subscription is never reused nor replaced automatically.
  if (row.status === "canceled") return "blocked";
  return row.billingType === type ? "reuse" : "blocked";
}

/** A claim older than this may be reconciled with Asaas (a late remote create has had time to land). */
export const STALE_CLAIM_MS = 15 * 60_000;
export function claimIsStale(updatedAt: Date, now = new Date()) {
  return now.getTime() - updatedAt.getTime() >= STALE_CLAIM_MS;
}

export type RemoteSubscription = { id: string; billingType?: string; deleted?: boolean };
/**
 * What to do with an in-flight claim after asking Asaas which subscriptions the customer has.
 * - release: the listing is complete and no live subscription exists, so nothing was created.
 * - adopt: exactly one live subscription of the claimed method exists; persist it instead of creating another.
 * - keep: anything else stays blocked for a human to reconcile.
 */
export function reconcileClaim(
  subscriptions: RemoteSubscription[],
  complete: boolean,
  method: CheckoutMethod,
): { action: "release" } | { action: "adopt"; subscriptionId: string } | { action: "keep" } {
  const live = subscriptions.filter((item) => item && typeof item.id === "string" && item.deleted !== true);
  if (complete && live.length === 0) return { action: "release" };
  if (complete && live.length === 1 && live[0].billingType === method) return { action: "adopt", subscriptionId: live[0].id };
  return { action: "keep" };
}

export function paymentPeriodEnd(dueDate: string | undefined) {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  const date = new Date(`${dueDate}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dueDate) return null;
  // Preserve the existing 35-day grace policy, anchored to the provider due date.
  date.setUTCDate(date.getUTCDate() + 35);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}
export function paidAmountMatches(value: unknown, amount: number) {
  return typeof value === "number" && Number.isFinite(value) && Number.isFinite(amount) && amount > 0 && Math.round(value * 100) === Math.round(amount * 100);
}
export function cardDetailsValid(number: string, expiry: string, ccv: string, now = new Date()) {
  if (!/^\d{13,19}$/.test(number) || !/^\d{4}(?:\d{2})?$/.test(expiry) || !/^\d{3,4}$/.test(ccv)) return false;
  const month = Number(expiry.slice(0, 2));
  const year = expiry.length === 4 ? 2000 + Number(expiry.slice(2)) : Number(expiry.slice(2));
  return month >= 1 && month <= 12 && (year > now.getUTCFullYear() || (year === now.getUTCFullYear() && month >= now.getUTCMonth() + 1));
}

export type BillingSnapshot = { status: string; providerPaymentId: string | null; providerCustomerId: string | null; endsAt: Date | null; amount: number };
export type PaymentSnapshot = { id: string; status?: string; customer?: string; dueDate?: string; value?: number };

/** The paid payment with the latest valid due date (the one that defines the current period). */
export function latestPaidPayment<T extends PaymentSnapshot>(payments: T[]) {
  return payments
    .filter((payment) => PAID_STATUSES.includes(payment.status ?? "") && paymentPeriodEnd(payment.dueDate))
    .sort((a, b) => (b.dueDate ?? "").localeCompare(a.dueDate ?? ""))[0] ?? null;
}

/** The payment a Pix QR should be generated for: oldest PENDING first, then oldest OVERDUE. */
export function openPixPayment<T extends PaymentSnapshot>(payments: T[]) {
  const byDue = (a: T, b: T) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
  const pending = payments.filter((payment) => payment.status === "PENDING").sort(byDue);
  const overdue = payments.filter((payment) => payment.status === "OVERDUE").sort(byDue);
  return pending[0] ?? overdue[0] ?? null;
}

export function paymentIsOpen(status?: string) {
  return OPEN_STATUSES.includes(status ?? "");
}

export function decidePayment(snapshot: BillingSnapshot, payment: PaymentSnapshot): { status: "active"; endsAt: Date } | { status: "canceled" | "past_due" } | null {
  if (!payment.customer || payment.customer !== snapshot.providerCustomerId) return null;
  const end = paymentPeriodEnd(payment.dueDate);
  if (!end) return null;
  const same = snapshot.providerPaymentId === payment.id;
  const olderOrEqual = snapshot.endsAt !== null && snapshot.endsAt >= end;
  if (PAID_STATUSES.includes(payment.status ?? "")) {
    if (!paidAmountMatches(payment.value, snapshot.amount) || snapshot.status === "canceled") return null;
    if (same && snapshot.status === "active" && olderOrEqual) return null;
    if (!same && snapshot.status !== "trialing" && olderOrEqual) return null;
    return { status: "active", endsAt: end };
  }
  if (["OVERDUE", "DELETED", "REFUNDED"].includes(payment.status ?? "")) {
    // An unpaid or removed Pix/card attempt does not cut the free trial short; the trial ends by endsAt.
    if (snapshot.status === "trialing" && payment.status !== "REFUNDED") return null;
    if (!same && (snapshot.status === "active" || snapshot.status !== "trialing" && olderOrEqual)) return null;
    const status = payment.status === "OVERDUE" ? "past_due" : "canceled";
    if (snapshot.status === status && same) return null;
    return { status };
  }
  return null;
}
