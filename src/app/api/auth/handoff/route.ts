import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { issueSessionToken } from "@/lib/session";
import {
  SESSION_COOKIE,
  readHandoffToken,
  safeAppPath,
  sessionCookieOptions,
  sessionIsCurrent,
} from "@/lib/session-token";
import { appUrl } from "@/lib/urls";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const next = safeAppPath(url.searchParams.get("next"));

  try {
    const handoff = await readHandoffToken(token);
    if (!handoff) {
      return NextResponse.redirect(appUrl("/login"));
    }

    const user = await prisma.user.findUnique({ where: { id: handoff.userId }, select: { passwordChangedAt: true, email: true, emailVerifiedAt: true } });
    if (!user || !sessionIsCurrent(handoff.issuedAt, user.passwordChangedAt) || (user.email && !user.emailVerifiedAt)) return NextResponse.redirect(appUrl("/login"));
    const sessionToken = await issueSessionToken(handoff.userId);
    const response = NextResponse.redirect(new URL(next, url.origin));
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.redirect(appUrl("/login"));
  }
}
