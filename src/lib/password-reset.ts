import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  authRateWindowStart,
  emailIsValid,
  generateResetToken,
  hashRequestIp,
  hashResetToken,
  loginIpIsRateLimited,
  loginIsRateLimited,
  normalizeEmail,
  passwordResetIsRateLimited,
  resetTokenExpiresAt,
  resetTokenStatus,
} from "@/lib/auth-security";
import { hashPassword, MIN_PASSWORD_LENGTH, passwordIsValid } from "@/lib/password";
import { resendIsConfigured, sendPasswordResetEmail } from "@/lib/resend";
import { appUrl } from "@/lib/urls";

const RESET_PURPOSE = "password_reset";
const LOGIN_PURPOSE = "login_failed";
const CLEANUP_AFTER_MS = 24 * 60 * 60 * 1000;

export const GENERIC_RESET_MESSAGE =
  "Se existir uma conta com esse endereço, você receberá um link para redefinir sua senha.";
export const RESET_LINK_INVALID_MESSAGE = "Este link já foi utilizado ou expirou.";

/** Só o que o fluxo de auth usa do Prisma; nos testes entra um banco em memória. */
export type AuthDb = Pick<PrismaClient, "authAttempt" | "passwordResetToken" | "user" | "$transaction">;
export type SendResetEmail = (input: { email: string; link: string }) => Promise<void>;

export type PasswordResetRequestResult =
  | { ok: true; message: string }
  | { ok: false; status: number; error: string };

export type PasswordResetConfirmResult =
  | { ok: true }
  | { ok: false; status: number; reason: "invalid" | "expired" | "used" | "weak_password"; error: string };

export function requestIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || headers.get("x-real-ip")?.trim() || "";
}

function ipHashFromHeaders(headers: Headers) {
  const secret = process.env.AUTH_SECRET?.trim() || "";
  if (!secret) return null;
  return hashRequestIp(requestIpFromHeaders(headers), secret);
}

export async function countRecentAttempts({
  purpose,
  email,
  ipHash,
  now = new Date(),
  db = prisma,
}: {
  purpose: string;
  email: string;
  ipHash?: string | null;
  now?: Date;
  db?: AuthDb;
}) {
  const createdAt = { gte: authRateWindowStart(now) };
  const [emailCount, ipCount] = await Promise.all([
    db.authAttempt.count({ where: { purpose, email, createdAt } }),
    ipHash ? db.authAttempt.count({ where: { purpose, requestIpHash: ipHash, createdAt } }) : Promise.resolve(0),
  ]);
  return { emailCount, ipCount };
}

export async function recordAuthAttempt({
  purpose,
  email,
  ipHash,
  now = new Date(),
  db = prisma,
}: {
  purpose: string;
  email: string;
  ipHash?: string | null;
  now?: Date;
  db?: AuthDb;
}) {
  await db.authAttempt.create({
    data: { purpose, email, requestIpHash: ipHash ?? null, createdAt: now },
  });
}

export async function loginRateIsLimited(email: string, headers: Headers, db: AuthDb = prisma, now = new Date()) {
  const { emailCount, ipCount } = await countRecentAttempts({
    purpose: LOGIN_PURPOSE,
    email: normalizeEmail(email),
    ipHash: ipHashFromHeaders(headers),
    now,
    db,
  });
  return loginIsRateLimited(emailCount) || loginIpIsRateLimited(ipCount);
}

export async function recordFailedLogin(email: string, headers: Headers, db: AuthDb = prisma, now = new Date()) {
  await recordAuthAttempt({
    purpose: LOGIN_PURPOSE,
    email: normalizeEmail(email),
    ipHash: ipHashFromHeaders(headers),
    now,
    db,
  });
}

async function cleanupOldRecords(db: AuthDb, now: Date) {
  const cutoff = new Date(now.getTime() - CLEANUP_AFTER_MS);
  await Promise.all([
    db.authAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    db.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: cutoff } }, { usedAt: { not: null }, createdAt: { lt: cutoff } }] },
    }),
  ]);
}

/**
 * Pede o link de redefinição. A resposta é a mesma para e-mail com ou sem conta
 * (anti-enumeração); falhas de envio só vão para o log, sem dados sensíveis.
 */
export async function requestPasswordReset({
  email: rawEmail,
  headers,
  sendEmail = sendPasswordResetEmail,
  emailConfigured = resendIsConfigured,
  now = new Date(),
  db = prisma,
}: {
  email: string;
  headers: Headers;
  sendEmail?: SendResetEmail;
  emailConfigured?: () => boolean;
  now?: Date;
  db?: AuthDb;
}): Promise<PasswordResetRequestResult> {
  const email = normalizeEmail(rawEmail);
  if (!emailIsValid(email)) {
    return { ok: false, status: 400, error: "Informe um e-mail válido." };
  }

  // configuração é igual para qualquer e-mail: responder antes de olhar o usuário não revela nada
  if (!emailConfigured()) {
    console.error("[auth] recuperação de senha indisponível: RESEND_API_KEY/AUTH_EMAIL_FROM ausentes");
    return { ok: false, status: 503, error: "Recuperação de senha indisponível no momento. Tente mais tarde." };
  }

  const ipHash = ipHashFromHeaders(headers);
  const attempts = await countRecentAttempts({ purpose: RESET_PURPOSE, email, ipHash, now, db });
  if (passwordResetIsRateLimited(attempts.emailCount, attempts.ipCount)) {
    return { ok: false, status: 429, error: "Muitas tentativas. Aguarde alguns minutos para pedir outro link." };
  }

  await recordAuthAttempt({ purpose: RESET_PURPOSE, email, ipHash, now, db });
  await cleanupOldRecords(db, now);

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { ok: true, message: GENERIC_RESET_MESSAGE };

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);

  try {
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: resetTokenExpiresAt(now), createdAt: now },
    });
    await sendEmail({ email, link: appUrl(`/redefinir-senha?token=${encodeURIComponent(token)}`) });
  } catch (error) {
    await db.passwordResetToken.deleteMany({ where: { tokenHash } }).catch(() => undefined);
    console.error("[auth] falha ao enviar e-mail de recuperação:", error instanceof Error ? error.message : "erro");
  }

  return { ok: true, message: GENERIC_RESET_MESSAGE };
}

export async function getResetTokenStatus(token: string, now = new Date(), db: AuthDb = prisma) {
  if (!token) return "invalid" as const;
  const tokenHash = hashResetToken(token);
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { tokenHash: true, expiresAt: true, usedAt: true },
  });
  return resetTokenStatus(record, tokenHash, now);
}

export async function confirmPasswordReset({
  token,
  password,
  now = new Date(),
  db = prisma,
}: {
  token: string;
  password: string;
  now?: Date;
  db?: AuthDb;
}): Promise<PasswordResetConfirmResult> {
  if (!passwordIsValid(password)) {
    return {
      ok: false,
      status: 400,
      reason: "weak_password",
      error: `Senha com no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  const tokenHash = hashResetToken(token);
  const record = token
    ? await db.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, tokenHash: true, expiresAt: true, usedAt: true },
      })
    : null;
  const status = resetTokenStatus(record, tokenHash, now);
  if (status !== "valid" || !record) {
    return { ok: false, status: 400, reason: status === "valid" ? "invalid" : status, error: RESET_LINK_INVALID_MESSAGE };
  }

  const passwordHash = await hashPassword(password);
  const changed = await db.$transaction(async (tx) => {
    // marca como usado só se ainda estiver livre: dois cliques simultâneos não trocam a senha duas vezes
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return false;
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordChangedAt: now },
    });
    // outros links pendentes do mesmo usuário deixam de valer
    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now },
    });
    return true;
  });

  if (!changed) {
    return { ok: false, status: 400, reason: "used", error: RESET_LINK_INVALID_MESSAGE };
  }
  return { ok: true };
}
