import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
  readSessionToken,
} from "@/lib/session-token";

export async function issueSessionToken(userId: number) {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: { slug: true },
  });
  return signSessionToken(userId, company?.slug);
}

export async function createSession(userId: number) {
  const token = await issueSessionToken(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const options = sessionCookieOptions();
  jar.set(SESSION_COOKIE, "", { ...options, maxAge: 0 });
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await readSessionToken(token);
    if (!session) return null;

    return prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        company: {
          include: {
            city: true,
            state: true,
            businessCategory: true,
          },
        },
      },
    });
  } catch {
    return null;
  }
}
