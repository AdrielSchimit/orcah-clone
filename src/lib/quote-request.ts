/** Mantém o contrato da API de pedidos, inclusive os detalhes opcionais. */
export function quoteRequestPayload(form: FormData, stateId: string, cityName: string) {
  return {
    customerName: form.get("customerName"),
    customerPhone: form.get("customerPhone"),
    desiredService: form.get("desiredService"),
    description: form.get("description"),
    neighborhood: form.get("neighborhood"),
    preferredTime: form.get("preferredTime"),
    stateId: stateId || undefined,
    cityName: stateId ? cityName : "",
  };
}

export function quoteRequestUrl(currentUrl: string, service: string) {
  const url = new URL(currentUrl);
  if (service) url.searchParams.set("servico", service.slice(0, 160));
  else url.searchParams.delete("servico");
  url.hash = "pedir";
  return `${url.pathname}${url.search}${url.hash}`;
}

export function closedQuoteRequestUrl(currentUrl: string) {
  const url = new URL(currentUrl);
  url.searchParams.delete("servico");
  if (url.hash === "#pedir") url.hash = "";
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function sendQuoteRequest(slug: string, payload: ReturnType<typeof quoteRequestPayload>, fetcher: typeof fetch = fetch) {
  const response = await fetcher(`/api/publico/empresas/${encodeURIComponent(slug)}/pedir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar.");
}
