/**
 * Creating an Asaas subscription is not proof of a paid invoice.
 * Reuse an existing card checkout instead of risking duplicate subscriptions.
 * Failed-payment recovery is a separate launch gate.
 */
export function cardCheckoutAlreadyStarted(subscription: {
  provider: string;
  billingType?: string | null;
  providerSubscriptionId?: string | null;
  status: string;
} | null | undefined) {
  return Boolean(
    subscription?.provider === "asaas" &&
    subscription.billingType === "CREDIT_CARD" &&
    subscription.providerSubscriptionId &&
    subscription.status !== "canceled",
  );
}
