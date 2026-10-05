import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  EMAIL_VERIFICATION_TTL_MINUTES,
  emailIsValid,
  generateResetToken,
  hashResetToken,
  normalizeEmail,
  resetTokenStatus,
  VERIFY_EMAIL_IP_LIMIT,
  VERIFY_EMAIL_LIMIT,
} from "@/lib/auth-security";
import { countRecentAttempts, ipHashFromHeaders, recordAuthAttempt } from "@/lib/password-reset";
import { resendIsConfigured, sendVerificationEmail } from "@/lib/resend";
import { appUrl } from "@/lib/urls";

/**
 * Verificação de posse do e-mail. Formato válido não basta ("BATATA@TESTE.COM" passa no formato):
 * a conta só entra depois que alguém abre o link que chegou naquela caixa.
 * Token: 32 bytes aleatórios, só o SHA-256 no banco, 30 minutos, uso único.
 */

const VERIFY_PURPOSE = "verify_email";

export type VerifyDb = Pick<PrismaClient, "authAttempt" | "emailVerificationToken" | "user" | "$transaction">;
export type SendVerificationEmail = (input: { email: string; link: string }) => Promise<void>;

export const VERIFY_GENERIC_MESSAGE =
  "Se existir uma conta aguardando confirmação com esse e-mail, enviamos um novo link.";
export const VERIFY_LINK_INVALID_MESSAGE = "Este link de confirmação já foi usado ou expirou.";

/** "joao@gmail.com" → "jo***@gmail.com" (para mostrar sem expor o endereço inteiro). */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "";
  return `${user.slice(0, Math.min(2, user.length))}***@${domain}`;
}

export function verificationExpiresAt(now = new Date()) {
  return new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);
}

/** Cria o token e envia o link. Falha de envio não derruba o cadastro: a tela oferece reenviar. */
export async function sendVerificationForUser({
  user,
  sendEmail = sendVerificationEmail,
  emailConfigured = resendIsConfigured,
  now = new Date(),
  db = prisma,
}: {
  user: { id: number; email: string };
  sendEmail?: SendVerificationEmail;
  emailConfigured?: () => boolean;
  now?: Date;
  db?: VerifyDb;
}) {
  if (!emailConfigured()) {
    console.error("[auth] verificação de e-mail indisponível: Resend não configurado");
    return { sent: false };
  }
  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  try {
    await db.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt: verificationExpiresAt(now), createdAt: now },
    });
    await sendEmail({ email: user.email, link: appUrl(`/verificar-email?token=${encodeURIComponent(token)}`) });
    return { sent: true };
  } catch (error) {
    await db.emailVerificationToken.deleteMany({ where: { tokenHash } }).catch(() => undefined);
    console.error("[auth] falha ao enviar e-mail de verificação:", error instanceof Error ? error.message : "erro");
    return { sent: false };
  }
}

/** "Reenviar e-mail": mesma resposta com ou sem conta, com limite por e-mail e por origem. */
export async function requestVerificationResend({
  email: rawEmail,
  headers,
  sendEmail = sendVerificationEmail,
  emailConfigured = resendIsConfigured,
  now = new Date(),
  db = prisma,
}: {
  email: string;
  headers: Headers;
  sendEmail?: SendVerificationEmail;
  emailConfigured?: () => boolean;
  now?: Date;
  db?: VerifyDb;
}): Promise<{ ok: true; message: string } | { ok: false; status: number; error: string }> {
  const email = normalizeEmail(rawEmail);
  if (!emailIsValid(email)) return { ok: false, status: 400, error: "Informe um e-mail válido." };
  if (!emailConfigured()) {
    console.error("[auth] verificação de e-mail indisponível: Resend não configurado");
    return { ok: false, status: 503, error: "Não foi possível enviar o e-mail agora. Tente mais tarde." };
  }

  const ipHash = ipHashFromHeaders(headers);
  const attempts = await countRecentAttempts({ purpose: VERIFY_PURPOSE, email, ipHash, now, db });
  if (attempts.emailCount >= VERIFY_EMAIL_LIMIT || attempts.ipCount >= VERIFY_EMAIL_IP_LIMIT) {
    return { ok: false, status: 429, error: "Muitos envios. Aguarde alguns minutos para pedir outro link." };
  }
  await recordAuthAttempt({ purpose: VERIFY_PURPOSE, email, ipHash, now, db });

  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, emailVerifiedAt: true } });
  if (user?.email && !user.emailVerifiedAt) {
    await sendVerificationForUser({ user: { id: user.id, email: user.email }, sendEmail, emailConfigured, now, db });
  }
  return { ok: true, message: VERIFY_GENERIC_MESSAGE };
}

/** Confirma o e-mail. Devolve o usuário para abrir a sessão. */
export async function confirmEmailToken({
  token,
  now = new Date(),
  db = prisma,
}: {
  token: string;
  now?: Date;
  db?: VerifyDb;
}): Promise<{ ok: true; userId: number } | { ok: false; reason: "invalid" | "expired" | "used"; error: string }> {
  const tokenHash = hashResetToken(token);
  const record = token
    ? await db.emailVerificationToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, tokenHash: true, expiresAt: true, usedAt: true },
      })
    : null;
  const status = resetTokenStatus(record, tokenHash, now);
  if (status !== "valid" || !record) {
    return { ok: false, reason: status === "valid" ? "invalid" : status, error: VERIFY_LINK_INVALID_MESSAGE };
  }

  const confirmed = await db.$transaction(async (tx) => {
    const consumed = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return false;
    await tx.user.updateMany({ where: { id: record.userId, emailVerifiedAt: null }, data: { emailVerifiedAt: now } });
    // outros links pendentes da mesma conta deixam de valer
    await tx.emailVerificationToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } });
    return true;
  });
  if (!confirmed) return { ok: false, reason: "used", error: VERIFY_LINK_INVALID_MESSAGE };
  return { ok: true, userId: record.userId };
}
