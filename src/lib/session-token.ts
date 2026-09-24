import { SignJWT, jwtVerify } from "jose";
import { companyPublicUrl, sessionCookieIsShared, tenantSlugFromHost } from "@/lib/urls";

export { sessionCookieIsShared };

export const SESSION_COOKIE = "orcah_session";

type SessionPayload = {
  userId: number;
  slug?: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET ausente no .env");
  }
  return new TextEncoder().encode(value);
}

export function sessionCookieOptions() {
  const host = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/^www\./, "");
  const share = sessionCookieIsShared();

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    ...(share ? { domain: `.${host}` } : {}),
  };
}

export async function signSessionToken(userId: number, slug?: string | null) {
  return new SignJWT({ userId, slug: slug ?? "" } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function signHandoffToken(userId: number) {
  return new SignJWT({ userId, purpose: "handoff" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(secret());
}

export async function readSessionToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  const userId = Number((payload as SessionPayload).userId);
  const slug = typeof payload.slug === "string" ? payload.slug : "";
  if (!userId) return null;
  return { userId, slug };
}

export async function readHandoffToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  if (payload.purpose !== "handoff") return null;
  const userId = Number(payload.userId);
  if (!userId) return null;
  return userId;
}

export function safeAppPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/painel";
  }
  if (value.startsWith("/painel") || value === "/onboarding") return value;
  return "/painel";
}

export async function continueOnStore(
  hostHeader: string,
  _userId: number,
  slug: string | null | undefined,
  path: string,
) {
  if (!slug) return path;
  const destPath = safeAppPath(path);
  if (tenantSlugFromHost(hostHeader) === slug) return destPath;
  if (sessionCookieIsShared()) {
    return `${companyPublicUrl(slug)}${destPath}`;
  }
  return destPath;
}
