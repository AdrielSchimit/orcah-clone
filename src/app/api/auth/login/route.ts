import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { sessionCookieIsShared } from "@/lib/urls";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    next: user.company ? (sessionCookieIsShared() ? "/entrando" : "/painel") : "/onboarding",
  });
}
