import { knowledge, type KnowledgeDocument } from "./knowledge";
export type RetrievedDocument = KnowledgeDocument & { score: number };
export interface KnowledgeRetriever { retrieve(question: string, route: string): RetrievedDocument[] }
export const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const stop = new Set(["como", "criar", "um", "uma", "o", "a", "os", "as", "de", "do", "da", "e", "em", "no", "na", "meu", "minha", "que", "para", "por", "com", "quero", "qual", "funciona", "posso"]);
const tokens = (value: string) => normalize(value).split(" ").filter(t => t.length > 2 && !stop.has(t));
export function safeRoute(value: string) {
  const path = value.split(/[?#]/)[0];
  if (path.startsWith("/painel/orcamentos/novo")) return "/painel/orcamentos/novo";
  const area = path.match(/^\/painel\/(orcamentos|servicos|pagina|plano|conta|mais|pedidos|clientes|relatorios|empresa)(?:\/|$)/)?.[1];
  return area ? `/painel/${area}` : "/painel";
}
export const localRetriever: KnowledgeRetriever = { retrieve(question, route) {
  const query = normalize(question), words = tokens(question), screen = safeRoute(route);
  return knowledge.map(doc => {
    const title = normalize(doc.title), tags = doc.tags.map(normalize), body = normalize(doc.content);
    let score = Math.max(0, ...tags.map(tag => (` ${query} `).includes(` ${tag} `) ? 10 + tag.split(" ").length * 8 : 0));
    for (const word of words) {
      if (title.split(" ").some(t => t === word || (word.length > 4 && t.startsWith(word.slice(0, -1))))) score += 3;
      if (tags.some(tag => tag.split(" ").includes(word))) score += 2;
      if (body.split(" ").includes(word)) score += 1;
    }
    if (score > 0 && doc.routes.includes(screen)) score += 2;
    return { ...doc, score };
  }).filter(doc => doc.score >= 4).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 3);
} };

export function wantsHuman(question: string) {
  const text = normalize(question);
  // Detect explicit requests, not ordinary questions about handoff/cancelling it.
  return /^(quero|preciso|gostaria|prefiro|desejo) (falar|conversar) (com|c uma) (uma pessoa|alguem|um humano|um atendente|o suporte)/.test(text)
    || /^(falar com uma pessoa|atendimento humano|quero um atendente|quero uma pessoa|quero falar com cesar|quero falar com adriel)$/.test(text);
}
