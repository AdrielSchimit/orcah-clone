import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { confirmEmailToken } from "@/lib/email-verification";
import { createSession } from "@/lib/session";
import { sessionCookieIsShared } from "@/lib/urls";

/** POST (não GET): leitores de link de e-mail não gastam o token sozinhos. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const result = await confirmEmailToken({ token: String(body.token ?? "") });
  if (!result.ok) {
    return NextResponse.json({ error: result.error, reason: result.reason }, { status: 400 });
  }

  await createSession(result.userId);
  const company = await prisma.company.findUnique({ where: { userId: result.userId }, select: { id: true } });
  return NextResponse.json({
    ok: true,
    next: company ? (sessionCookieIsShared() ? "/entrando" : "/painel") : "/onboarding",
  });
}
