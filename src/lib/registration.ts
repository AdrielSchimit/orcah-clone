import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emailIsValid, normalizeEmail, REGISTER_IP_LIMIT } from "@/lib/auth-security";
import {
  requestVerificationResend,
  sendVerificationForUser,
  type SendVerificationEmail,
  type VerifyDb,
} from "@/lib/email-verification";
import { hashPassword } from "@/lib/password";
import { registrationPasswordIsValid } from "@/lib/password-rules";
import { countRecentAttempts, ipHashFromHeaders, recordAuthAttempt } from "@/lib/password-reset";
import { resendIsConfigured, sendVerificationEmail } from "@/lib/resend";

const REGISTER_PURPOSE = "register";

export type RegisterDb = VerifyDb & Pick<PrismaClient, "user">;

export type RegisterResult =
  | { ok: true; next: "/verificar-email"; emailSent: boolean }
  | { ok: true; next: "/onboarding"; userId: number }
  | { ok: false; status: number; error: string };

/**
 * Cadastro público: com e-mail, confirma a posse por link; sem e-mail, entra pelo telefone.
 * A permissão da nova conta é sempre USER.
 * Nada que venha no corpo (role, emailVerifiedAt...) é usado para permissão.
 */
export async function registerUser({
  body,
  headers,
  sendEmail = sendVerificationEmail,
  emailConfigured = resendIsConfigured,
  now = new Date(),
  db = prisma,
}: {
  body: Record<string, unknown>;
  headers: Headers;
  sendEmail?: SendVerificationEmail;
  emailConfigured?: () => boolean;
  now?: Date;
  db?: RegisterDb;
}): Promise<RegisterResult> {
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = normalizeEmail(String(body.email ?? ""));
  const phone = String(body.phone ?? "").replace(/\D/g, "").slice(0, 20);
  const password = String(body.password ?? "");

  if (name.length < 2) return { ok: false, status: 400, error: "Informe seu nome." };
  if (email && !emailIsValid(email)) return { ok: false, status: 400, error: "E-mail inválido." };
  if (!email && !/^[0-9]{10,11}$/.test(phone)) return { ok: false, status: 400, error: "Informe um telefone com DDD para criar sua conta sem e-mail." };
  if (!registrationPasswordIsValid(password)) return { ok: false, status: 400, error: password.trim() ? "Use uma senha mais curta." : "Digite sua senha." };

  const ipHash = ipHashFromHeaders(headers);
  const attempts = await countRecentAttempts({ purpose: REGISTER_PURPOSE, email, ipHash, now, db });
  if (attempts.ipCount >= REGISTER_IP_LIMIT) {
    return { ok: false, status: 429, error: "Muitas tentativas. Aguarde alguns minutos." };
  }
  await recordAuthAttempt({ purpose: REGISTER_PURPOSE, email, ipHash, now, db });

  if (phone) {
    const phoneOwner = await db.user.findFirst({ where: { phone }, select: { id: true, email: true } });
    if (phoneOwner && phoneOwner.email !== (email || null)) {
      return { ok: false, status: 409, error: "Este telefone já tem conta. Entre com seu telefone ou e-mail." };
    }
  }

  const exists = email
    ? await db.user.findUnique({ where: { email }, select: { id: true, emailVerifiedAt: true } })
    : await db.user.findFirst({ where: { email: null, phone }, select: { id: true, emailVerifiedAt: true } });
  if (!email && exists) return { ok: false, status: 409, error: "Este telefone já tem conta. Entre com seu telefone e senha." };
  if (exists?.emailVerifiedAt) {
    return { ok: false, status: 409, error: "Este e-mail já tem conta. Entre ou use “Esqueci a senha”." };
  }
  if (exists) {
    // conta pendente: não troca nome nem senha (quem cadastrou pode não ser o dono); só reenvia o link
    const resend = await requestVerificationResend({ email, headers, sendEmail, emailConfigured, now, db });
    return { ok: true, next: "/verificar-email", emailSent: resend.ok };
  }

  let user: { id: number; email: string | null };
  try {
    user = await db.user.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      passwordHash: await hashPassword(password),
      role: "USER",
      emailVerifiedAt: null,
    },
    select: { id: true, email: true },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { ok: false, status: 409, error: "Já existe uma conta com esses dados. Entre com seu telefone ou e-mail." };
    }
    throw error;
  }

  if (!email) return { ok: true, next: "/onboarding", userId: user.id };
  const { sent } = await sendVerificationForUser({ user: { id: user.id, email }, sendEmail, emailConfigured, now, db });
  return { ok: true, next: "/verificar-email", emailSent: sent };
}
