import { NextResponse } from "next/server";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { evolutionEnabled, robotLogout, robotQrCode, robotState } from "@/lib/evolution";

/** Situação do WhatsApp automático. Guarda "conectado" para o envio não precisar perguntar toda vez. */
export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;
  if (!evolutionEnabled()) return NextResponse.json({ enabled: false, state: "close" });

  const state = await robotState(auth.company.id);
  const connected = state === "open";
  if (connected !== auth.company.whatsappRobot) {
    await prisma.company.update({ where: { id: auth.company.id }, data: { whatsappRobot: connected } });
  }
  return NextResponse.json({ enabled: true, state });
}

export async function POST(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const { action } = (await request.json().catch(() => ({}))) as { action?: string };
  if (action === "hide-prompt") {
    await prisma.company.update({ where: { id: auth.company.id }, data: { whatsappPromptHidden: true } });
    return NextResponse.json({ ok: true });
  }
  if (!evolutionEnabled()) {
    return NextResponse.json({ error: "WhatsApp automático indisponível no momento." }, { status: 503 });
  }
  if (action === "qr") {
    const qr = await robotQrCode(auth.company.id).catch(() => "");
    if (!qr) return NextResponse.json({ error: "Não consegui gerar o QR Code. Tente de novo." }, { status: 502 });
    return NextResponse.json({ ok: true, qr });
  }
  if (action === "logout") {
    await robotLogout(auth.company.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
