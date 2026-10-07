import { SupportError } from "./domain";

export function supportResponse(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "private, no-store", vary: "Cookie" } });
}
export function supportFailure(error: unknown) {
  if (error instanceof SupportError) return supportResponse({ error: error.message }, error.status);
  console.error("[support] request failed", error instanceof Error ? error.name : "error");
  return supportResponse({ error: "Não foi possível atualizar o suporte. Tente novamente." }, 503);
}
