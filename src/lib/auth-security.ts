import { createHash, createHmac, randomBytes } from "crypto";

export const PASSWORD_RESET_TTL_MINUTES = 15;
export const AUTH_RATE_WINDOW_MINUTES = 10;
export const LOGIN_FAILED_LIMIT = 5;
export const LOGIN_IP_LIMIT = 20;
export const PASSWORD_RESET_EMAIL_LIMIT = 3;
export const PASSWORD_RESET_IP_LIMIT = 10;

export type ResetTokenStatus = "valid" | "invalid" | "expired" | "used";

export type ResetTokenLike = {
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function emailIsValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
