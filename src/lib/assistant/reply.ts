import type { AssistantReply } from "../support/service";
import { configuredProvider, type AssistantProvider } from "./provider";
import { localRetriever, safeRoute, type KnowledgeRetriever } from "./retrieval";

export type SafeAssistantContext = { route: string; company: string; category: string };
export async function assistantReply(question: string, context: SafeAssistantContext, options: { provider?: AssistantProvider | null; retriever?: KnowledgeRetriever } = {}): Promise<AssistantReply> {
  const route = safeRoute(context.route);
  const docs = (options.retriever || localRetriever).retrieve(question, route);
  const fallback = docs[0]?.content || (/^(oi|ola|bom dia|boa tarde|boa noite)[!.?\s]*$/i.test(question.trim())
    ? "Olá! Posso ajudar com orçamentos, serviços, sua página e plano. O que você gostaria de saber?"
    : "Ainda não tenho uma orientação segura para essa pergunta. Posso explicar orçamentos, serviços, sua página, cidades atendidas e plano. Se precisar, toque em Falar com uma pessoa.");
  const sources = docs.map(d => d.id);
  const provider = options.provider === undefined ? configuredProvider() : options.provider;
  // The account's public company/category context is available locally only. External
  // generation receives a curated intent instead of potentially sensitive free text.
  if (provider && docs.length) {
    try { return { content: await provider.generate({ intent: docs[0].title, screen: route, documents: docs }), sources, provider: provider.name }; }
    catch { /* deterministic answer remains available on timeout/error */ }
  }
  return { content: fallback, sources, provider: "local" };
}
