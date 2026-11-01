import { prisma } from "@/lib/db";
import { whatsappNumber } from "@/lib/whatsapp";

// Evolution API v2 (Baileys). Uma instância por empresa, conectada pelo QR Code em Conta.
// Sem EVOLUTION_API_URL/EVOLUTION_API_KEY o envio automático some e tudo fica manual (wa.me).

export function evolutionEnabled() {
  return Boolean(process.env.EVOLUTION_API_URL?.trim() && process.env.EVOLUTION_API_KEY?.trim());
}

export function showRobotPrompt(company: { whatsappRobot: boolean; whatsappPromptHidden: boolean }) {
  return evolutionEnabled() && !company.whatsappRobot && !company.whatsappPromptHidden;
}

export function instanceName(companyId: number) {
  return `orcah-${companyId}`;
}

async function call(path: string, init: { method?: string; body?: unknown } = {}) {
  const base = process.env.EVOLUTION_API_URL!.trim().replace(/\/+$/, "");
  const response = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers: { apikey: process.env.EVOLUTION_API_KEY!.trim(), "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, data };
}

export type RobotState = "open" | "connecting" | "close";

export async function robotState(companyId: number): Promise<RobotState> {
  const res = await call(`/instance/connectionState/${instanceName(companyId)}`).catch(() => null);
  const state = (res?.data.instance as { state?: string } | undefined)?.state;
  return state === "open" || state === "connecting" ? state : "close";
}

/** Cria a instância se precisar e devolve o QR Code (data URL) para escanear. */
export async function robotQrCode(companyId: number): Promise<string> {
  const name = instanceName(companyId);
  let res = await call(`/instance/connect/${name}`);
  if (res.status === 404) {
    await call("/instance/create", {
      method: "POST",
      body: { instanceName: name, qrcode: true, integration: "WHATSAPP-BAILEYS" },
    });
    res = await call(`/instance/connect/${name}`);
  }
  return typeof res.data.base64 === "string" ? res.data.base64 : "";
}

export async function robotLogout(companyId: number) {
  await call(`/instance/logout/${instanceName(companyId)}`, { method: "DELETE" }).catch(() => null);
  await prisma.company.update({ where: { id: companyId }, data: { whatsappRobot: false } });
}

/** Tenta mandar pelo robô. false = não mandou; quem chamou cai no link manual. */
export async function robotSend(company: { id: number; whatsappRobot: boolean }, phone: string, text: string) {
  const number = whatsappNumber(phone);
  if (!company.whatsappRobot || !evolutionEnabled() || !number) return false;
  const res = await call(`/message/sendText/${instanceName(company.id)}`, {
    method: "POST",
    body: { number, text },
  }).catch(() => null);
  return Boolean(res?.ok);
}
