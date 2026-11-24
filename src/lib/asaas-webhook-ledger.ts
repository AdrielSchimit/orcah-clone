import { prisma } from "@/lib/db";
import { AsaasHttpError } from "@/lib/asaas";

/** Asaas event ids look like `evt_<hex>&<n>`. Anything else is not used as a ledger key. */
const EVENT_ID = /^[A-Za-z0-9_&.:-]{1,120}$/;

export function webhookEventId(value: unknown): string | null {
  return typeof value === "string" && EVENT_ID.test(value) ? value : null;
}

/** Short, payload-free failure code for the ledger (never the error message, which may echo provider data). */
export function webhookErrorCode(error: unknown): string {
  if (error instanceof AsaasHttpError) return `asaas_${error.status}`;
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^P\d{4}$/.test(error.code)) {
    return `db_${error.code}`;
  }
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  return "error";
}

function prismaCode(error: unknown) {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : null;
}

function uniqueViolation(error: unknown) {
  return prismaCode(error) === "P2002";
}

/** P2021: the table does not exist (code deployed before the migration). */
export function ledgerMissing(error: unknown) {
  return prismaCode(error) === "P2021";
}

export type WebhookEventStart = "new" | "retry" | "duplicate";

/**
 * Claims an event id. "duplicate" means an earlier delivery finished processing it, so it must be acknowledged
 * without being applied again. "retry" means an earlier delivery failed (or is still running): processing is
 * idempotent because the route pulls the current payment from Asaas and writes conditionally, so it runs again.
 */
export async function beginWebhookEvent(input: {
  id: string;
  event: string;
  paymentId?: string | null;
  subscriptionId?: string | null;
}): Promise<WebhookEventStart> {
  try {
    await prisma.asaasWebhookEvent.create({
      data: {
        id: input.id,
        event: input.event.slice(0, 60),
        paymentId: input.paymentId?.slice(0, 80) ?? null,
        subscriptionId: input.subscriptionId?.slice(0, 80) ?? null,
      },
    });
    return "new";
  } catch (error) {
    if (!uniqueViolation(error)) throw error;
  }
  const existing = await prisma.asaasWebhookEvent.findUnique({ where: { id: input.id }, select: { processedAt: true } });
  if (existing?.processedAt) return "duplicate";
  await prisma.asaasWebhookEvent.updateMany({ where: { id: input.id, processedAt: null }, data: { attempts: { increment: 1 } } });
  return "retry";
}

export async function finishWebhookEvent(id: string) {
  await prisma.asaasWebhookEvent.updateMany({ where: { id, processedAt: null }, data: { processedAt: new Date(), lastError: null } });
}

/** Best effort: a failure to record the failure must not hide the original one. */
export async function failWebhookEvent(id: string, error: unknown) {
  try {
    await prisma.asaasWebhookEvent.updateMany({ where: { id, processedAt: null }, data: { lastError: webhookErrorCode(error) } });
  } catch {
    // ignored
  }
}
