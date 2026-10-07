export type SupportStatus = "BOT" | "QUEUED" | "HUMAN" | "RESOLVED";
export type SupportPriority = "NORMAL" | "HIGH";
export type SenderType = "USER" | "ASSISTANT" | "OPERATOR" | "SYSTEM";
export type SupportAction = "escalate" | "cancel-human" | "claim" | "resolve" | "reopen" | "return-to-bot" | "priority";
export type ProviderActor = { kind: "provider"; userId: number; companyId: number };
export type OperatorActor = { kind: "operator"; id: string; name: string };
export type SupportActor = ProviderActor | OperatorActor;
export type SupportMessageDTO = {
  id: string; clientId: string | null; senderType: SenderType; senderName: string | null;
  content: string; createdAt: string; readAt: string | null;
};
export type SupportThreadDTO = {
  id: string; status: SupportStatus; priority: SupportPriority; assignedOperator: string | null;
  assignedOperatorId: string | null; lastMessageAt: string; queuedAt: string | null;
  humanStartedAt: string | null; resolvedAt: string | null; unread: number;
};
export type SupportSnapshot = {
  thread: SupportThreadDTO; messages: SupportMessageDTO[]; olderCursor: string | null;
};
export type SupportContext = {
  companyId: number; company: string; provider: string; category: string; city: string;
  whatsapp: string; plan: string; planStatus: string; services: number; budgets: number;
};
export type InboxRow = SupportThreadDTO & { context: SupportContext; lastMessage: SupportMessageDTO | null };
export type InboxSnapshot = { rows: InboxRow[]; nextOffset: number | null };
export type OperatorSnapshot = SupportSnapshot & { context: SupportContext };
export const SUPPORT_STATUS_LABEL: Record<SupportStatus, string> = {
  BOT: "Assistente virtual", QUEUED: "Na fila", HUMAN: "Em atendimento", RESOLVED: "Resolvido",
};
export const MESSAGE_MAX_LENGTH = 2000;
