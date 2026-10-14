import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProviderShowcase } from "../src/components/provider-showcase";
import { QuoteRequestForm } from "../src/components/quote-request-form";
import { trackPageEvent } from "../src/components/page-tracking";
import type { PublicCompanyPage } from "../src/lib/public-page";
import { closedQuoteRequestUrl, quoteRequestPayload, quoteRequestUrl, sendQuoteRequest } from "../src/lib/quote-request";

const page: PublicCompanyPage = {
  slug: "pintada", name: "Pintada", description: "Melhor Pintada da Cidade",
  ramo: "Pintor", coverCategory: "pintor", place: "Maravilha - SC", areaLabel: "Maravilha - SC",
  whatsapp: "49988330375", phone: "49988330375", instagram: "cesarturmina", facebook: null,
  website: null, openingHours: null, logoPath: null, coverPath: null,
  primaryColor: null, secondaryColor: null,
  photos: [{ path: "/photo.webp", title: "Trabalho" }],
  services: [{ name: "Pintura Interna", description: "Acabamento", category: null, imagePath: null, featured: false, unit: "m²", price: 30 }],
};
const buttonStyles = { gold: "shared-gold", secondary: "shared-secondary" };
function render(overrides: Partial<PublicCompanyPage> = {}, chosenService = "") {
  return renderToStaticMarkup(createElement(ProviderShowcase, { page: { ...page, ...overrides }, chosenService, buttonStyles }));
}

describe("vitrine do prestador", () => {
  it("prioriza trabalhos e não monta o formulário antes do pedido", () => {
    const html = render();
    assert.ok(html.indexOf('id="trabalhos"') < html.indexOf('id="servicos"'));
    assert.ok(html.indexOf('id="servicos"') < html.indexOf('id="contato"'));
    assert.ok(!html.includes("<form"));
    assert.ok(!html.includes("<dialog"));
    const navigation = html.match(/<nav[\s\S]*?<\/nav>/)?.[0] ?? "";
    assert.ok(!navigation.includes("Pedir orçamento"));
    assert.ok(!html.includes("Ainda sem avaliações"));
  });

  it("mantém um único diálogo e formulário para deep-link de serviço", () => {
    const html = render({}, "Pintura Interna");
    assert.equal((html.match(/<dialog/g) ?? []).length, 1);
    assert.equal((html.match(/<form/g) ?? []).length, 1);
    assert.ok(html.includes('aria-labelledby="quote-dialog-title"'));
    assert.ok(html.includes('aria-label="Fechar orçamento"'));
    assert.ok(html.includes('value="Pintura Interna"'));
    assert.ok(html.includes('aria-haspopup="dialog"'));
    assert.ok(html.includes('class="provider-sticky" hidden=""'));
  });

  it("não inventa trabalhos nem serviços quando não cadastrados", () => {
    const html = render({ photos: [], services: [] });
    assert.ok(!html.includes('id="trabalhos"'));
    assert.ok(!html.includes('id="servicos"'));
    assert.ok(!html.includes('href="#trabalhos"'));
    assert.ok(!html.includes('href="#servicos"'));
    assert.ok(html.includes('id="contato"'));
    assert.ok(html.includes("Pedir orçamento"));
  });

  it("funciona sem WhatsApp, telefone e redes, com fallbacks de capa/logo", () => {
    const html = render({ whatsapp: null, phone: null, instagram: null, photos: [], services: [] });
    assert.ok(!html.includes("wa.me"));
    assert.ok(!html.includes("tel:"));
    assert.ok(!html.includes("instagram.com"));
    assert.ok(html.includes("provider-logo-fallback"));
    assert.ok(html.includes("provider-cover"));
    assert.ok(html.includes("Página feita com Orçah"));
  });

  it("não mostra preço oculto e escapa textos longos do prestador", () => {
    const name = "Pintada <script>".repeat(20);
    const html = render({ name, description: "Descrição <script>".repeat(40), services: [{ ...page.services[0], price: null }] });
    assert.ok(!html.includes("R$"));
    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("&lt;script&gt;"));
  });

  it("primeira etapa contém apenas nome, WhatsApp e descrição; detalhes são opcionais", () => {
    const html = renderToStaticMarkup(createElement(QuoteRequestForm, { slug: "pintada", defaultService: "Pintura Interna" }));
    const initial = html.split("<details")[0];
    assert.ok(initial.includes('name="customerName"'));
    assert.ok(initial.includes('name="customerPhone"'));
    assert.ok(initial.includes('name="description"'));
    assert.ok(!initial.includes("quote-state"));
    assert.ok(!initial.includes("quote-city"));
    assert.ok(!initial.includes("quote-neighborhood"));
    assert.ok(html.includes("Adicionar mais detalhes"));
    assert.ok(!html.includes("<details open"));
    assert.ok(html.includes('name="desiredService"'));
  });
});

describe("orçamento sob demanda", () => {
  it("atualiza query sem perder origem ou parâmetros existentes e fecha sem hash morto", () => {
    const url = quoteRequestUrl("http://pintada.localhost:3000/?utm_source=instagram#servicos", "Pintura & acabamento");
    const parsed = new URL(url, "http://pintada.localhost:3000");
    assert.equal(parsed.searchParams.get("utm_source"), "instagram");
    assert.equal(parsed.searchParams.get("servico"), "Pintura & acabamento");
    assert.equal(parsed.hash, "#pedir");
    assert.equal(closedQuoteRequestUrl(parsed.href), "/?utm_source=instagram");
    assert.equal(quoteRequestUrl(parsed.href, ""), "/?utm_source=instagram#pedir");
  });

  it("preserva o serviço e detalhes no mesmo payload, descartando cidade sem estado", () => {
    const form = new FormData();
    form.set("customerName", "Cliente de teste");
    form.set("customerPhone", "(49) 99999-0000");
    form.set("desiredService", "Pintura Interna");
    form.set("description", "Pintar a sala");
    form.set("neighborhood", "Centro");
    form.set("preferredTime", "À tarde");
    const payload = quoteRequestPayload(form, "24", "Maravilha");
    assert.equal(payload.desiredService, "Pintura Interna");
    assert.equal(payload.neighborhood, "Centro");
    assert.equal(payload.preferredTime, "À tarde");
    assert.equal(payload.stateId, "24");
    assert.equal(payload.cityName, "Maravilha");
    assert.equal(quoteRequestPayload(form, "", "Maravilha").cityName, "");
  });

  it("envia o formulário à API existente e transmite falhas de validação", async () => {
    const form = new FormData();
    form.set("customerName", "Cliente de teste");
    form.set("customerPhone", "49999990000");
    form.set("desiredService", "Pintura Interna");
    const payload = quoteRequestPayload(form, "", "");
    let calls = 0;
    const fetcher: typeof fetch = async (url, options) => {
      calls++;
      assert.equal(url, "/api/publico/empresas/pintada/pedir");
      assert.equal(options?.method, "POST");
      assert.deepEqual(JSON.parse(String(options?.body)), JSON.parse(JSON.stringify(payload)));
      return Response.json({ ok: true, id: 1 });
    };
    await sendQuoteRequest("pintada", payload, fetcher);
    assert.equal(calls, 1);
    await assert.rejects(sendQuoteRequest("pintada", payload, async () => Response.json({ error: "Informe seu WhatsApp." }, { status: 400 })), /Informe seu WhatsApp/);
    await assert.rejects(sendQuoteRequest("pintada", payload, async () => { throw new TypeError("offline"); }), /offline/);
  });

  it("tracking de orçamento/WhatsApp/Instagram mantém o endpoint e tipo por ação", async () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    const events: { url: string; body: Blob }[] = [];
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { sendBeacon(url: string, body: Blob) { events.push({ url, body }); return true; } } });
    try {
      trackPageEvent("pintada", "quote");
      trackPageEvent("pintada", "whatsapp");
      trackPageEvent("pintada", "instagram");
      assert.equal(events.length, 3);
      assert.ok(events.every(event => event.url === "/api/publico/empresas/pintada/metrica"));
      assert.deepEqual(await Promise.all(events.map(async event => JSON.parse(await event.body.text()).tipo)), ["quote", "whatsapp", "instagram"]);
    } finally {
      if (previous) Object.defineProperty(globalThis, "navigator", previous);
      else Reflect.deleteProperty(globalThis, "navigator");
    }
  });
});
