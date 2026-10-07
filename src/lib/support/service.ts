import type { Prisma, PrismaClient, SupportMessage, SupportThread } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { authorizeThread, messageInput, SupportError, transition } from "./domain";
import type { InboxSnapshot, OperatorActor, ProviderActor, SupportAction, SupportActor, SupportContext, SupportMessageDTO, SupportPriority, SupportSnapshot, SupportThreadDTO } from "./types";

type DB = Pick<PrismaClient, "$transaction" | "supportThread" | "supportMessage">;
type Tx = Prisma.TransactionClient;
export type AssistantReply = { content: string; sources: string[]; provider: string };
export type ReplyGenerator = (question: string, route: string) => Promise<AssistantReply>;
type ReplyLease = { token: string; expiresAt: number; attempts: number; completed?: boolean };
function leaseFrom(message: SupportMessage): ReplyLease | undefined {
  const metadata = message.metadata as { replyLease?: ReplyLease } | null;
  return metadata?.replyLease;
}
function replyMetadata(message: SupportMessage, lease: ReplyLease) {
  const old = message.metadata && typeof message.metadata === "object" && !Array.isArray(message.metadata) ? message.metadata : {};
  return { ...old, replyLease: lease } as Prisma.InputJsonObject;
}

function messageDTO(m: SupportMessage): SupportMessageDTO {
  return { id: m.id, clientId: m.clientId, senderType: m.senderType, senderName: m.senderName, content: m.content, createdAt: m.createdAt.toISOString(), readAt: m.readAt?.toISOString() ?? null };
}
function threadDTO(t: SupportThread, unread: number): SupportThreadDTO {
  return { id: t.id, status: t.status, priority: t.priority, assignedOperator: t.assignedOperator, assignedOperatorId: t.assignedOperatorId, lastMessageAt: t.lastMessageAt.toISOString(), queuedAt: t.queuedAt?.toISOString() ?? null, humanStartedAt: t.humanStartedAt?.toISOString() ?? null, resolvedAt: t.resolvedAt?.toISOString() ?? null, unread };
}

async function lockedThread(tx: Tx, id: string, actor: SupportActor) {
  // Parameterized SQL. Row lock serializes claim, messages, transitions and limits across instances.
  await tx.$queryRaw`SELECT id FROM support_threads WHERE id = ${id} FOR UPDATE`;
  const thread = await tx.supportThread.findUnique({ where: { id } });
  if (!thread) throw new SupportError(404, "Conversa não encontrada.");
  authorizeThread(actor, thread);
  return thread;
}

async function rateLimit(tx: Tx, threadId: string, senderType: "USER" | "OPERATOR" | "SYSTEM", limit: number) {
  const count = await tx.supportMessage.count({ where: { threadId, senderType, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  if (count >= limit) throw new SupportError(429, "Muitas mensagens. Aguarde um minuto e tente novamente.");
}

export async function ensureSupportThread(db: DB, actor: ProviderActor) {
  return db.supportThread.upsert({
    where: { companyId_userId: { companyId: actor.companyId, userId: actor.userId } },
    create: { companyId: actor.companyId, userId: actor.userId }, update: {},
  });
}

export async function readSupportThread(db: DB, actor: SupportActor, id: string, before?: string, after?: string): Promise<SupportSnapshot> {
  const thread = await db.supportThread.findUnique({ where: { id } });
  if (!thread) throw new SupportError(404, "Conversa não encontrada.");
  authorizeThread(actor, thread);
  if ((before && after) || (before && before.length > 100) || (after && after.length > 100)) throw new SupportError(400, "Página do histórico inválida.");
  const cursorId = before || after;
  const cursor = cursorId ? await db.supportMessage.findFirst({ where: { id: cursorId, threadId: id } }) : null;
  if (cursorId && !cursor) throw new SupportError(400, "Página do histórico inválida.");
  const messages = await db.supportMessage.findMany({
    where: { threadId: id, ...(cursor ? { OR: [{ createdAt: { [after ? "gt" : "lt"]: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { [after ? "gt" : "lt"]: cursor.id } }] } : {}) },
    orderBy: [{ createdAt: after ? "asc" : "desc" }, { id: after ? "asc" : "desc" }], take: 101,
  });
  const hasMore = messages.length > 100;
  const page = after ? messages.slice(0, 100) : messages.slice(0, 100).reverse();
  const unread = await db.supportMessage.count({ where: { threadId: id, readAt: null, senderType: actor.kind === "operator" ? "USER" : { in: ["ASSISTANT", "OPERATOR", "SYSTEM"] } } });
  return { thread: threadDTO(thread, unread), messages: page.map(messageDTO), olderCursor: !after && hasMore ? page[0].id : null, ...(after ? { incremental: true } : {}) };
}

export async function markSupportRead(db: DB, actor: SupportActor, id: string, throughId: string) {
  return db.$transaction(async tx => {
    await lockedThread(tx, id, actor);
    const message = await tx.supportMessage.findFirst({ where: { id: throughId, threadId: id } });
    if (!message) throw new SupportError(400, "Mensagem não encontrada.");
    // Only IDs actually present when the reader captured this snapshot are acknowledged.
    await tx.supportMessage.updateMany({ where: { threadId: id, readAt: null, senderType: actor.kind === "operator" ? "USER" : { in: ["ASSISTANT", "OPERATOR", "SYSTEM"] }, OR: [{ createdAt: { lt: message.createdAt } }, { createdAt: message.createdAt, id: { lte: message.id } }] }, data: { readAt: new Date() } });
  });
}

export async function sendSupportMessage(db: DB, actor: SupportActor, id: string, input: unknown, generate?: ReplyGenerator, route = "/painel", requestHuman = false) {
  const validated = messageInput(input);
  const senderType = actor.kind === "provider" ? "USER" : "OPERATOR";
  const accepted = await db.$transaction(async tx => {
    const thread = await lockedThread(tx, id, actor);
    const previous = await tx.supportMessage.findFirst({ where: { threadId: id, senderType, clientId: validated.clientId } });
    if (previous) {
      if (previous.content !== validated.content) throw new SupportError(409, "Identificador já utilizado por outra mensagem.");
      const lease = leaseFrom(previous);
      const answered = await tx.supportMessage.findFirst({ where: { threadId: id, senderType: "ASSISTANT", clientId: `reply_${validated.clientId}` } });
      if (actor.kind !== "provider" || !generate || requestHuman || thread.status !== "BOT" || answered || lease?.completed || (lease && (lease.expiresAt > Date.now() || lease.attempts >= 3))) return { message: previous, lease: undefined };
      const renewed = { token: randomUUID(), expiresAt: Date.now() + 12000, attempts: (lease?.attempts || 0) + 1 };
      await tx.supportMessage.update({ where: { id: previous.id }, data: { metadata: replyMetadata(previous, renewed) } });
      return { message: previous, lease: renewed };
    }
    if (thread.status === "RESOLVED") throw new SupportError(409, "Volte ao assistente ou reabra o atendimento para enviar uma mensagem.");
    if (actor.kind === "operator" && (thread.status !== "HUMAN" || thread.assignedOperatorId !== actor.id)) {
      throw new SupportError(409, "Assuma o atendimento antes de responder.");
    }
    await rateLimit(tx, id, senderType, actor.kind === "provider" ? 15 : 30);
    const now = new Date(Math.max(Date.now(), thread.lastMessageAt.getTime() + 1));
    const lease: ReplyLease | undefined = actor.kind === "provider" && thread.status === "BOT" && generate && !requestHuman ? { token: randomUUID(), expiresAt: Date.now() + 12000, attempts: 1 } : undefined;
    const message = await tx.supportMessage.create({ data: { id: randomUUID(), threadId: id, senderType, senderName: actor.kind === "operator" ? actor.name : null, ...validated, createdAt: now, ...(lease ? { metadata: { replyLease: lease } } : {}) } });
    await tx.supportThread.update({ where: { id }, data: { lastMessageAt: now, ...(!thread.subject ? { subject: validated.content.slice(0, 120) } : {}) } });
    if (requestHuman && actor.kind === "provider") await transitionLocked(tx, actor, { ...thread, lastMessageAt: now }, "escalate");
    return { message, lease };
  });
  if (actor.kind === "provider" && accepted.lease && generate) {
    const replyId = `reply_${validated.clientId}`;
    const previous = await db.supportMessage.findFirst({ where: { threadId: id, senderType: "ASSISTANT", clientId: replyId } });
    if (!previous) {
      const reply = await generate(validated.content, route);
      // No external request inside a database transaction; recheck handoff after generation.
      await db.$transaction(async tx => {
        const thread = await lockedThread(tx, id, actor);
        const current = await tx.supportMessage.findUnique({ where: { id: accepted.message.id } });
        if (thread.status !== "BOT" || !current || leaseFrom(current)?.token !== accepted.lease!.token) return;
        if (await tx.supportMessage.findFirst({ where: { threadId: id, senderType: "ASSISTANT", clientId: replyId } })) return;
        const now = new Date(Math.max(Date.now(), thread.lastMessageAt.getTime() + 1));
        await tx.supportMessage.create({ data: { id: randomUUID(), threadId: id, senderType: "ASSISTANT", senderName: "Assistente ORÇAH", clientId: replyId, content: reply.content.slice(0, 2000), metadata: { sources: reply.sources, provider: reply.provider }, createdAt: now } });
        await tx.supportThread.update({ where: { id }, data: { lastMessageAt: now } });
        await tx.supportMessage.update({ where: { id: current.id }, data: { metadata: replyMetadata(current, { ...accepted.lease!, completed: true }) } });
      });
    }
  }
  return readSupportThread(db, actor, id);
}

async function transitionLocked(tx: Tx, actor: SupportActor, thread: SupportThread, action: SupportAction, priority?: SupportPriority) {
    const id = thread.id;
    const change = transition(thread, actor, action, priority);
    if (!change || (action === "priority" && priority === thread.priority)) return;
    await rateLimit(tx, id, "SYSTEM", 12);
    const now = new Date(Math.max(Date.now(), thread.lastMessageAt.getTime() + 1));
    await tx.supportThread.update({ where: { id }, data: {
      status: change.status,
      ...(action === "priority" ? { priority } : {}),
      ...(change.status !== "HUMAN" ? { assignedOperator: null, assignedOperatorId: null } : {}),
      ...(action === "claim" && actor.kind === "operator" ? { assignedOperator: actor.name, assignedOperatorId: actor.id, humanStartedAt: now } : {}),
      ...(action !== "priority" && change.status === "QUEUED" ? { queuedAt: now, humanStartedAt: null, resolvedAt: null } : {}),
      ...(action !== "priority" && change.status === "RESOLVED" ? { resolvedAt: now } : {}),
      ...(action !== "priority" && change.status === "BOT" ? { queuedAt: null, humanStartedAt: null, resolvedAt: null } : {}),
      lastMessageAt: now,
    } });
    await tx.supportMessage.create({ data: { id: randomUUID(), threadId: id, senderType: "SYSTEM", content: change.text, senderName: actor.kind === "operator" ? actor.name : null, createdAt: now, metadata: { action, actor: actor.kind === "operator" ? actor.id : "provider" } } });
}
export async function actOnSupportThread(db: DB, actor: SupportActor, id: string, action: SupportAction, priority?: SupportPriority) {
  await db.$transaction(async tx => transitionLocked(tx, actor, await lockedThread(tx, id, actor), action, priority));
  return readSupportThread(db, actor, id);
}

const contextSelect = {
  id: true, name: true, customRamoName: true, whatsapp: true,
  user: { select: { name: true } }, businessCategory: { select: { name: true } }, city: { select: { name: true } }, state: { select: { uf: true } },
  subscription: { select: { plan: true, status: true, endsAt: true } }, _count: { select: { services: true, budgets: true } },
} satisfies Prisma.CompanySelect;
type ContextCompany = Prisma.CompanyGetPayload<{ select: typeof contextSelect }>;
function contextDTO(c: ContextCompany): SupportContext {
  const expired = c.subscription?.endsAt && c.subscription.endsAt.getTime() <= Date.now();
  return { companyId: c.id, company: c.name, provider: c.user.name, category: c.customRamoName || c.businessCategory?.name || "Não informado", city: c.city ? `${c.city.name} / ${c.state.uf}` : c.state.uf, whatsapp: c.whatsapp, plan: c.subscription?.plan || "Não informado", planStatus: expired ? "expired" : c.subscription?.status || "Não informado", services: c._count.services, budgets: c._count.budgets };
}
export async function supportContext(db: DB, actor: OperatorActor, id: string) {
  void actor;
  const thread = await db.supportThread.findUnique({ where: { id }, select: { company: { select: contextSelect } } });
  if (!thread) throw new SupportError(404, "Conversa não encontrada.");
  return contextDTO(thread.company);
}

export async function supportInbox(db: DB, actor: OperatorActor, status: string, query: string, offset = 0): Promise<InboxSnapshot> {
  void actor;
  if (status && !["BOT", "QUEUED", "HUMAN", "RESOLVED"].includes(status)) throw new SupportError(400, "Filtro inválido.");
  const q = query.trim().slice(0, 100);
  if (!Number.isFinite(offset) || offset < 0 || offset > 10000) throw new SupportError(400, "Página da fila inválida.");
  const pageOffset = Math.floor(offset);
  const rows = await db.supportThread.findMany({
    where: { ...(status ? { status: status as SupportThread["status"] } : {}), ...(q ? { company: { OR: [{ name: { contains: q, mode: "insensitive" } }, { whatsapp: { contains: q } }, { email: { contains: q, mode: "insensitive" } }, { user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } }] } } : {}) },
    include: { company: { select: contextSelect }, messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 }, _count: { select: { messages: { where: { senderType: "USER", readAt: null } } } } },
    orderBy: [{ priority: "desc" }, ...(status === "QUEUED" ? [{ queuedAt: "asc" as const }] : [{ lastMessageAt: "desc" as const }]), { id: "asc" }],
    skip: pageOffset, take: 61,
  });
  return { rows: rows.slice(0, 60).map(t => ({ ...threadDTO(t, t._count.messages), context: contextDTO(t.company), lastMessage: t.messages[0] ? messageDTO(t.messages[0]) : null })), nextOffset: rows.length > 60 && pageOffset + 60 <= 10000 ? pageOffset + 60 : null };
}
