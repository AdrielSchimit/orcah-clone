import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isBotUserAgent, isPageEvent, recordPageEvent } from "@/lib/page-stats";
import { getSessionUser } from "@/lib/session";

// resposta sempre vazia: não confirma se a empresa existe nem se contou
const done = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (isBotUserAgent(request.headers.get("user-agent"))) return done();

  const raw = await request.text().catch(() => "");
  let tipo: unknown;
  try {
    tipo = (JSON.parse(raw) as { tipo?: unknown }).tipo;
  } catch {
    return done();
  }
  if (!isPageEvent(tipo)) return done();

  const company = await prisma.company.findUnique({
    where: { slug: (await context.params).slug },
    select: { id: true },
  });
  if (!company) return done();

  // o dono olhando a própria página não infla os números
  const user = await getSessionUser().catch(() => null);
  if (user?.company?.id === company.id) return done();

  await recordPageEvent(prisma, company.id, tipo).catch(() => console.error("[metrica] falha ao contar"));
  return done();
}
