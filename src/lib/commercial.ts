import { parseMoney, roundMoney } from "@/lib/money";

export const DISCOUNT_TYPES = ["amount", "percent"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PAYMENT_METHODS = ["pix", "card", "boleto", "cash", "transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_CONDITIONS = ["cash", "deposit_balance", "installments_2", "installments_3", "custom"] as const;
export type PaymentCondition = (typeof PAYMENT_CONDITIONS)[number];

export type CommercialInput = {
  discountType?: unknown;
  discountValue?: unknown;
  paymentMethod?: unknown;
  acceptedPaymentMethods?: unknown;
  paymentCondition?: unknown;
  downPaymentType?: unknown;
  downPaymentValue?: unknown;
};

export type CommercialTerms = {
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  paymentMethod: PaymentMethod | null;
  acceptedPaymentMethods: PaymentMethod[];
  paymentCondition: PaymentCondition;
  downPaymentType: DiscountType | null;
  downPaymentValue: number;
  downPaymentAmount: number;
  balanceAmount: number;
};

type CalculationError = { error: string };

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  cash: "Dinheiro",
  transfer: "Transferência",
};

export const PAYMENT_CONDITION_LABEL: Record<PaymentCondition, string> = {
  cash: "À vista",
  deposit_balance: "Entrada + saldo",
  installments_2: "2x",
  installments_3: "3x",
  custom: "Personalizado",
};

function isDiscountType(value: unknown): value is DiscountType {
  return DISCOUNT_TYPES.includes(value as DiscountType);
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

function isPaymentCondition(value: unknown): value is PaymentCondition {
  return PAYMENT_CONDITIONS.includes(value as PaymentCondition);
}

function parsePercent(value: unknown) {
  return roundMoney(parseMoney(value as string | number | null | undefined));
}

export function calculateDiscount(
  subtotal: number,
  type: unknown,
  value: unknown,
): {
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  total: number;
} | CalculationError {
  const discountType = isDiscountType(type) ? type : "amount";
  const discountValue = parsePercent(value);
  const base = roundMoney(Math.max(0, subtotal));
  if (discountValue < 0) {
    return { error: "Desconto inválido." };
  }
  const discountAmount = discountType === "percent"
    ? roundMoney((base * discountValue) / 100)
    : discountValue;

  if (discountType === "percent" && discountValue > 100) {
    return { error: "Desconto percentual não pode passar de 100%." as const };
  }
  if (discountAmount > base) {
    return { error: "Desconto maior que o subtotal." as const };
  }

  return {
    discountType,
    discountValue,
    discountAmount,
    total: roundMoney(base - discountAmount),
  };
}

export function calculateDownPayment(
  total: number,
  type: unknown,
  value: unknown,
): {
  downPaymentType: DiscountType;
  downPaymentValue: number;
  downPaymentAmount: number;
  balanceAmount: number;
} | CalculationError {
  const downPaymentType = isDiscountType(type) ? type : "percent";
  const downPaymentValue = parsePercent(value);
  const base = roundMoney(Math.max(0, total));
  if (downPaymentValue < 0) {
    return { error: "Entrada inválida." };
  }
  const downPaymentAmount = downPaymentType === "percent"
    ? roundMoney((base * downPaymentValue) / 100)
    : downPaymentValue;

  if (downPaymentType === "percent" && downPaymentValue > 100) {
    return { error: "Entrada percentual não pode passar de 100%." as const };
  }
  if (downPaymentAmount > base) {
    return { error: "Entrada maior que o total." as const };
  }

  return {
    downPaymentType,
    downPaymentValue,
    downPaymentAmount,
    balanceAmount: roundMoney(base - downPaymentAmount),
  };
}

export function normalizeCommercialTerms(
  subtotal: number,
  input: CommercialInput = {},
): CommercialTerms | CalculationError {
  const discount = calculateDiscount(subtotal, input.discountType, input.discountValue);
  if ("error" in discount) return discount;

  const accepted = Array.isArray(input.acceptedPaymentMethods)
    ? input.acceptedPaymentMethods.filter(isPaymentMethod)
    : [];
  const paymentMethod = isPaymentMethod(input.paymentMethod) ? input.paymentMethod : accepted[0] ?? "pix";
  const acceptedPaymentMethods = [...new Set([paymentMethod, ...accepted])];
  const paymentCondition = isPaymentCondition(input.paymentCondition) ? input.paymentCondition : "cash";

  const downPayment = paymentCondition === "deposit_balance"
    ? calculateDownPayment(discount.total, input.downPaymentType, input.downPaymentValue)
    : {
        downPaymentType: null,
        downPaymentValue: 0,
        downPaymentAmount: 0,
        balanceAmount: discount.total,
      };
  if ("error" in downPayment) return downPayment;

  return {
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountAmount: discount.discountAmount,
    paymentMethod,
    acceptedPaymentMethods,
    paymentCondition,
    downPaymentType: downPayment.downPaymentType,
    downPaymentValue: downPayment.downPaymentValue,
    downPaymentAmount: downPayment.downPaymentAmount,
    balanceAmount: downPayment.balanceAmount,
  } satisfies CommercialTerms;
}
