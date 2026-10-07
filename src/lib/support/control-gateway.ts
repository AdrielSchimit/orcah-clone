import { SupportError } from "./domain";
import { actOnSupportThread, markSupportRead, readSupportThread, sendSupportMessage, supportContext, supportInbox } from "./service";
import { prisma } from "../db";
import type { OperatorActor, SupportAction, SupportPriority } from "./types";

export function gatewayOperator(value: unknown): OperatorActor {
  const id = value && typeof value === "object" ? (value as Record<string, unknown>).id : null;
  if (id !== "1" && id !== "2") throw new SupportError(403, "Operador não autorizado.");
  return { kind: "operator", id, name: id === "1" ? "Adriel" : "César" };
}

export async function controlSupport(params: Record<string, unknown>) {
  // Only called after the existing internal secret is verified. Control supplies identity from its server session.
  const operator = gatewayOperator(params.operator);
  const operation = params.operation;
  if (operation === "inbox") return supportInbox(prisma, operator, typeof params.status === "string" ? params.status : "", typeof params.q === "string" ? params.q : "", typeof params.offset === "number" ? params.offset : 0);
  if (typeof params.threadId !== "string" || !params.threadId || params.threadId.length > 100) throw new SupportError(400, "Conversa inválida.");
  const id = params.threadId;
  let result;
  if (operation === "thread") result = await readSupportThread(prisma, operator, id, typeof params.before === "string" ? params.before : undefined);
  else if (operation === "messages") result = await sendSupportMessage(prisma, operator, id, { content: params.content, clientId: params.clientId });
  else if (operation === "read") {
    if (typeof params.throughId !== "string") throw new SupportError(400, "Mensagem inválida.");
    await markSupportRead(prisma, operator, id, params.throughId); return { ok: true };
  } else if (typeof operation === "string" && ["claim", "resolve", "reopen", "return-to-bot", "priority"].includes(operation)) {
    result = await actOnSupportThread(prisma, operator, id, operation as SupportAction, params.priority as SupportPriority);
  } else throw new SupportError(400, "Ação inválida.");
  return { ...result, context: await supportContext(prisma, operator, id) };
}
