import type { SupportActor, SupportAction, SupportPriority, SupportStatus } from "./types";
import { MESSAGE_MAX_LENGTH } from "./types";

export class SupportError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function authorizeThread(actor: SupportActor, thread: { userId: number; companyId: number }) {
  if (actor.kind === "provider" && (actor.userId !== thread.userId || actor.companyId !== thread.companyId)) {
    throw new SupportError(404, "Conversa não encontrada.");
  }
}

export function messageInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new SupportError(400, "Mensagem inválida.");
  const row = input as Record<string, unknown>;
  if (row.senderType !== undefined || row.senderName !== undefined || row.operator !== undefined) {
    throw new SupportError(400, "O remetente é definido pela sessão.");
  }
  if (typeof row.content !== "string" || !row.content.trim() || row.content.length > MESSAGE_MAX_LENGTH) {
    throw new SupportError(400, `Escreva uma mensagem com até ${MESSAGE_MAX_LENGTH} caracteres.`);
  }
  if (typeof row.clientId !== "string" || !/^[a-zA-Z0-9_-]{8,80}$/.test(row.clientId)) {
    throw new SupportError(400, "Identificador da mensagem inválido.");
  }
  return { content: row.content.trim(), clientId: row.clientId };
}

export function transition(thread: { status: SupportStatus; assignedOperatorId: string | null }, actor: SupportActor, action: SupportAction, priority?: SupportPriority) {
  const status = thread.status;
  if (actor.kind === "provider" && !["escalate", "cancel-human", "return-to-bot"].includes(action)) {
    throw new SupportError(403, "Ação reservada ao suporte.");
  }
  if (actor.kind === "operator" && thread.assignedOperatorId && thread.assignedOperatorId !== actor.id && status === "HUMAN") {
    throw new SupportError(409, "Outro operador está atendendo esta conversa.");
  }
  switch (action) {
    case "escalate":
      if (status === "QUEUED" || status === "HUMAN") return null;
      return { status: "QUEUED" as const, text: "Seu atendimento entrou na fila. Você pode continuar usando o ORÇAH normalmente e eu aviso quando alguém assumir." };
    case "claim":
      if (status === "HUMAN" && actor.kind === "operator" && thread.assignedOperatorId === actor.id) return null;
      if (status !== "QUEUED") throw new SupportError(409, "Este atendimento não está na fila.");
      return { status: "HUMAN" as const, text: `Atendimento com ${actor.kind === "operator" ? actor.name : "suporte"}.` };
    case "resolve":
      if (status === "RESOLVED") return null;
      if (status !== "HUMAN") throw new SupportError(409, "Assuma o atendimento antes de resolver.");
      return { status: "RESOLVED" as const, text: "Atendimento resolvido. Você pode voltar ao Assistente ORÇAH ou pedir uma pessoa novamente." };
    case "reopen":
      if (status !== "RESOLVED") throw new SupportError(409, "Somente um atendimento resolvido pode ser reaberto.");
      return { status: "QUEUED" as const, text: "Atendimento reaberto e colocado na fila." };
    case "cancel-human":
      if (status !== "QUEUED") throw new SupportError(409, "Só é possível cancelar enquanto estiver na fila.");
      return { status: "BOT" as const, text: "Pedido de atendimento cancelado. O Assistente ORÇAH está disponível." };
    case "return-to-bot":
      if (actor.kind === "provider" && status === "HUMAN") throw new SupportError(409, "Peça ao operador para finalizar o atendimento.");
      if (status === "BOT") return null;
      return { status: "BOT" as const, text: "Conversa devolvida ao Assistente ORÇAH." };
    case "priority":
      if (priority !== "HIGH" && priority !== "NORMAL") throw new SupportError(400, "Prioridade inválida.");
      return { status, text: priority === "HIGH" ? "Prioridade marcada como alta." : "Prioridade marcada como normal." };
    default: throw new SupportError(400, "Ação inválida.");
  }
}
