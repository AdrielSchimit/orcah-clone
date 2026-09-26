import { createHash, createHmac, randomBytes } from "crypto";

export const PASSWORD_RESET_TTL_MINUTES = 15;
export const AUTH_RATE_WINDOW_MINUTES = 10;
export const LOGIN_FAILED_LIMIT = 5;
export const LOGIN_IP_LIMIT = 20;
export const PASSWORD_RESET_EMAIL_LIMIT = 3;
export const PASSWORD_RESET_IP_LIMIT = 10;
export const EMAIL_VERIFICATION_TTL_MINUTES = 30;
export const VERIFY_EMAIL_LIMIT = 3;
export const VERIFY_EMAIL_IP_LIMIT = 10;
export const REGISTER_IP_LIMIT = 10;

export type ResetTokenStatus = "valid" | "invalid" | "expired" | "used";

export type ResetTokenLike = {
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}$/;

/** Formato razoável (já normalizado). Não prova que a caixa existe: isso é a verificação por e-mail. */
export function emailIsValid(value: string) {
  if (value.length < 6 || value.length > 180) return false;
  if (value.includes("..") || value.startsWith(".") || value.split("@")[0].endsWith(".")) return false;
  return EMAIL_PATTERN.test(value);
}

export function generateResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function resetTokenExpiresAt(now = new Date()) {
  return new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
}

export function authRateWindowStart(now = new Date()) {
  return new Date(now.getTime() - AUTH_RATE_WINDOW_MINUTES * 60 * 1000);
}

export function resetTokenStatus(record: ResetTokenLike | null, tokenHash: string, now = new Date()): ResetTokenStatus {
  if (!record || record.tokenHash !== tokenHash) return "invalid";
  if (record.usedAt) return "used";
  if (record.expiresAt.getTime() <= now.getTime()) return "expired";
  return "valid";
}

export function hashRequestIp(ip: string, secret: string) {
  const value = ip.trim();
  if (!value) return null;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function loginIsRateLimited(failedAttempts: number) {
  return failedAttempts >= LOGIN_FAILED_LIMIT;
}

export function loginIpIsRateLimited(failedAttempts: number) {
  return failedAttempts >= LOGIN_IP_LIMIT;
}

export function passwordResetIsRateLimited(emailRequests: number, ipRequests = 0) {
  return emailRequests >= PASSWORD_RESET_EMAIL_LIMIT || ipRequests >= PASSWORD_RESET_IP_LIMIT;
}
