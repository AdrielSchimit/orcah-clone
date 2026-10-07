import { timingSafeEqual } from "node:crypto";
import { SupportError } from "./domain";

export function controlAuthorized(request: Request, secret = process.env.CONTROL_INTERNAL_SECRET?.trim() ?? "") {
  const received = Buffer.from(request.headers.get("x-orcah-control-secret")?.trim() ?? "");
  const expected = Buffer.from(secret);
  return expected.length >= 32 && received.length === expected.length && timingSafeEqual(received, expected);
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    throw new SupportError(403, "Origem inválida.");
  }
}

export async function supportBody(request: Request) {
  // Limitar também o corpo antes de parsear: metadados extras não burlam o limite.
  if (Number(request.headers.get("content-length")) > 12000) throw new SupportError(413, "Requisição muito grande.");
  const reader = request.body?.getReader();
  if (!reader) throw new SupportError(400, "JSON inválido.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 12000) { await reader.cancel(); throw new SupportError(413, "Requisição muito grande."); }
    chunks.push(value);
  }
  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new SupportError(400, "JSON inválido."); }
}
