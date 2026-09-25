import { NextResponse } from "next/server";
import { emailIsValid, normalizeEmail } from "@/lib/auth-security";
import { prisma } from "@/lib/db";
import { hashPassword, MIN_PASSWORD_LENGTH, passwordIsValid } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  const name = body.name?.trim() ?? "";
  const email = normalizeEmail(body.email ?? "");
  const phone = body.phone?.replace(/\D/g, "") ?? "";
  const password = body.password ?? "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }
  if (!emailIsValid(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }
  if (!passwordIsValid(password)) {
    return NextResponse.json({ error: `Senha com no mínimo ${MIN_PASSWORD_LENGTH} caracteres.` }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Este e-mail já tem conta." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash: await hashPassword(password),
    },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true, next: "/onboarding" });
}
