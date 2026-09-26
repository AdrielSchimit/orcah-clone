import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emailIsValid, normalizeEmail, REGISTER_IP_LIMIT } from "@/lib/auth-security";
import {
  requestVerificationResend,
  sendVerificationForUser,
  type SendVerificationEmail,
  type VerifyDb,
} from "@/lib/email-verification";
import { hashPassword, PASSWORD_POLICY_MESSAGE, passwordIsValid } from "@/lib/password";
import { countRecentAttempts, ipHashFromHeaders, recordAuthAttempt } from "@/lib/password-reset";
import { resendIsConfigured, sendVerificationEmail } from "@/lib/resend";

const REGISTER_PURPOSE = "register";

export type RegisterDb = VerifyDb & Pick<PrismaClient, "user">;

export type RegisterResult =
  | { ok: true; next: "/verificar-email"; emailSent: boolean }
  | { ok: false; status: number; error: string };

/**
 * Cadastro público: cria a conta pendente (sem sessão), sempre role USER, e manda o link.
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
  if (!emailIsValid(email)) return { ok: false, status: 400, error: "E-mail inválido." };
  if (!passwordIsValid(password)) return { ok: false, status: 400, error: PASSWORD_POLICY_MESSAGE };

  const ipHash = ipHashFromHeaders(headers);
  const attempts = await countRecentAttempts({ purpose: REGISTER_PURPOSE, email, ipHash, now, db });
  if (attempts.ipCount >= REGISTER_IP_LIMIT) {
    return { ok: false, status: 429, error: "Muitas tentativas. Aguarde alguns minutos." };
  }
  await recordAuthAttempt({ purpose: REGISTER_PURPOSE, email, ipHash, now, db });

  const exists = await db.user.findUnique({ where: { email }, select: { id: true, emailVerifiedAt: true } });
  if (exists?.emailVerifiedAt) {
    return { ok: false, status: 409, error: "Este e-mail já tem conta. Entre ou use “Esqueci a senha”." };
  }
  if (exists) {
    // conta pendente: não troca nome nem senha (quem cadastrou pode não ser o dono); só reenvia o link
    const resend = await requestVerificationResend({ email, headers, sendEmail, emailConfigured, now, db });
    return { ok: true, next: "/verificar-email", emailSent: resend.ok };
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash: await hashPassword(password),
      role: "USER",
      emailVerifiedAt: null,
    },
    select: { id: true, email: true },
  });

  const { sent } = await sendVerificationForUser({ user, sendEmail, emailConfigured, now, db });
  return { ok: true, next: "/verificar-email", emailSent: sent };
}
