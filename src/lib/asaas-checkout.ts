/**
 * Creating an Asaas subscription is not proof of a paid invoice.
 * Reuse an existing card checkout instead of risking duplicate subscriptions.
 * Failed-payment recovery is a separate launch gate.
 */
export function existingAsaasCheckoutMethod(subscription: {
  provider: string;
  billingType?: string | null;
  providerSubscriptionId?: string | null;
  status: string;
} | null | undefined) {
  if (
    subscription?.provider !== "asaas" ||
    !subscription.providerSubscriptionId ||
    subscription.status === "canceled"
  ) return null;
  return subscription.billingType === "CREDIT_CARD" || subscription.billingType === "PIX"
    ? subscription.billingType
    : null;
}

export function cardCheckoutAlreadyStarted(
  subscription: Parameters<typeof existingAsaasCheckoutMethod>[0],
) {
  return existingAsaasCheckoutMethod(subscription) === "CREDIT_CARD";
}
