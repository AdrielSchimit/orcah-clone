import { PLAN_PRICE } from "@/lib/plan-constants";

type AsaasErrorBody = {
  errors?: { code?: string; description?: string }[];
  message?: string;
};

export type AsaasCustomer = { id: string };
export type AsaasSubscription = { id: string; status?: string };
export type AsaasPayment = {
  id: string;
  status?: string;
  customer?: string;
  subscription?: string;
  dueDate?: string;
  value?: number;
};
export type AsaasPixQr = {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
};

function baseUrl() {
  return (process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3").replace(/\/$/, "");
}

function apiKey() {
  return process.env.ASAAS_API_KEY?.trim() ?? "";
}

export function asaasConfigured() {
  return apiKey().length > 10;
}

export function asaasErrorMessage(body: unknown, fallback = "Não foi possível falar com o Asaas.") {
  const data = body as AsaasErrorBody;
  const first = data.errors?.[0]?.description;
  if (first) return first;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

export async function asaas<T>(path: string, init?: RequestInit): Promise<T> {
  const key = apiKey();
  if (!key) {
    throw new Error("ASAAS_API_KEY ausente no .env");
  }

  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: key,
      Authorization: `Bearer ${key}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = {};
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      throw new Error("Resposta inválida do Asaas.");
    }
  }
  if (!response.ok) {
    throw new Error(asaasErrorMessage(body));
  }
  return body as T;
}

export async function findOrCreateAsaasCustomer(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone: string;
  companyId: number;
}) {
  const listed = await asaas<{ data?: AsaasCustomer[] }>(
    `/customers?externalReference=${encodeURIComponent(String(input.companyId))}&limit=1`,
  );
  if (listed.data?.[0]?.id) return listed.data[0];

  return asaas<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      mobilePhone: input.mobilePhone,
      notificationDisabled: true,
      externalReference: String(input.companyId),
    }),
  });
}

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export async function createPixSubscription(customerId: string) {
  return asaas<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: PLAN_PRICE,
      nextDueDate: todayISO(),
      cycle: "MONTHLY",
      description: "Orçah plano único",
    }),
  });
}

export async function createCardSubscription(input: {
  customerId: string;
  remoteIp: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  holder: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
    mobilePhone: string;
  };
}) {
  return asaas<AsaasSubscription & { creditCardToken?: string }>(
    "/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({
        customer: input.customerId,
        billingType: "CREDIT_CARD",
        value: PLAN_PRICE,
        nextDueDate: todayISO(),
        cycle: "MONTHLY",
        description: "Orçah plano único",
        remoteIp: input.remoteIp,
        creditCard: input.creditCard,
        creditCardHolderInfo: input.holder,
      }),
    },
  );
}

export async function firstSubscriptionPayment(subscriptionId: string) {
  const listed = await asaas<{ data?: AsaasPayment[] }>(
    `/payments?subscription=${encodeURIComponent(subscriptionId)}&limit=1`,
  );
  return listed.data?.[0] ?? null;
}

export async function getPayment(id: string) {
  return asaas<AsaasPayment>(`/payments/${id}`);
}

export async function getPixQr(paymentId: string) {
  return asaas<AsaasPixQr>(`/payments/${paymentId}/pixQrCode`);
}

export function paymentIsPaid(status?: string) {
  return status === "CONFIRMED" || status === "RECEIVED" || status === "RECEIVED_IN_CASH";
}

export function paymentIsOverdue(status?: string) {
  return status === "OVERDUE" || status === "DELETED" || status === "REFUNDED";
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  return request.headers.get("x-real-ip") || "127.0.0.1";
}
