import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assistantReply } from "../src/lib/assistant/reply";
import { knowledge } from "../src/lib/assistant/knowledge";
import { localRetriever, normalize, safeRoute, wantsHuman } from "../src/lib/assistant/retrieval";
import { openAIProvider } from "../src/lib/assistant/provider";

const context = { route: "/painel", company: "Empresa local", category: "Pintura" };
describe("retrieval versionado do ORÇAH", () => {
  for (const [question, id] of [
    ["Como criar um orçamento?", "criar-orcamento"], ["Como editar orçamento?", "editar-orcamento"],
    ["Como configurar minha página?", "pagina"], ["Como adicionar um serviço?", "servicos"],
    ["Como funciona meu plano?", "plano"], ["Trocar meu logo", "logo"], ["Trocar capa", "capa"],
    ["cidades atendidas", "area-atendimento"], ["Cliente pediu alteração", "pedido-alteracao"],
    ["como destacar serviço?", "destaques"], ["Buscar prestador", "busca"], ["Cliente aprova", "aprovacao"],
  ]) it(`encontra a orientação: ${question}`, () => { assert.equal(localRetriever.retrieve(question, "/painel")[0]?.id, id); });
  it("normaliza acentos e retorna no máximo três trechos", () => {
    assert.equal(normalize("ORÇAMENTO"), "orcamento");
    assert.ok(localRetriever.retrieve("página orçamento plano serviço fotos logo cidades", "/painel").length <= 3);
    assert.equal(new Set(knowledge.map(d => d.id)).size, knowledge.length);
    assert.equal(localRetriever.retrieve("previsão de dólar amanhã", "/painel").length, 0);
  });
  it("retorna orientação determinística sem provider e conserva fontes", async () => {
    const reply = await assistantReply("Como criar um orçamento?", context, { provider: null });
    assert.equal(reply.provider, "local"); assert.ok(reply.content.includes("Novo orçamento")); assert.ok(reply.sources.includes("criar-orcamento"));
  });
  it("não inventa resposta fora da base ou status específico da conta", async () => {
    const unknown = await assistantReply("Previsão de dólar amanhã", context, { provider: null });
    assert.equal(unknown.sources.length, 0); assert.ok(unknown.content.includes("Falar com uma pessoa"));
    const plan = await assistantReply("Meu plano foi pago?", context, { provider: null });
    assert.ok(plan.content.includes("não confirma pagamento"));
  });
  it("faz fallback quando o provider falha", async () => {
    const fallback = await assistantReply("Como criar orçamento?", context, { provider: { name: "fake", generate: async () => { throw new Error("timeout"); } } });
    assert.equal(fallback.provider, "local");
  });
  it("não envia pergunta/histórico/dados de conta para o provider", async () => {
    let captured = "";
    await assistantReply("Como criar orçamento? senha=segredo CPF 12345678901 token sk-secret", { ...context, route: "/painel/orcamentos/123?token=segredo", company: "Empresa senha segredo", category: "ramo segredo" }, { provider: { name: "fake", generate: async input => { captured = JSON.stringify(input); return "Use Novo orçamento."; } } });
    assert.ok(captured.includes("Criar orçamento"));
    for (const secret of ["segredo", "12345678901", "sk-secret", "ramo segredo", "Empresa senha"]) assert.ok(!captured.includes(secret));
    assert.equal(safeRoute("/painel/orcamentos/42?secret=x"), "/painel/orcamentos");
    assert.equal(safeRoute("https://evil.test/?token=secret"), "/painel");
  });
  it("pedido explícito de humano é reconhecido sem escalar dúvida ou negação", () => {
    for (const text of ["Quero falar com uma pessoa", "Falar com uma pessoa", "Quero falar com César"]) assert.equal(wantsHuman(text), true);
    for (const text of ["Não quero falar com uma pessoa", "Como falar com uma pessoa?", "Cancelar atendimento humano", "Como funciona o plano?"]) assert.equal(wantsHuman(text), false);
  });
});
describe("adapter opcional OpenAI", () => {
  it("usa Responses API sem armazenamento e extrai só texto completo", async () => {
    const fetcher: typeof fetch = async (url, init) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      const body = JSON.parse(init!.body as string); assert.equal(body.store, false); assert.equal(body.model, "test-model");
      return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "Resposta segura." }] }] });
    };
    assert.equal(await openAIProvider("test-key", "test-model", fetcher).generate({ intent: "Criar orçamento", screen: "/painel", documents: [] }), "Resposta segura.");
  });
  it("rejeita resposta incompleta para permitir fallback", async () => {
    const fetcher: typeof fetch = async () => Response.json({ status: "incomplete", output: [] });
    await assert.rejects(openAIProvider("test-key", "test-model", fetcher).generate({ intent: "Plano", screen: "/painel", documents: [] }));
  });
});
