import { NextResponse } from "next/server";
import { issueSessionToken } from "@/lib/session";
import {
  SESSION_COOKIE,
  readHandoffToken,
  safeAppPath,
  sessionCookieOptions,
} from "@/lib/session-token";
import { appUrl } from "@/lib/urls";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const next = safeAppPath(url.searchParams.get("next"));

  try {
    const userId = await readHandoffToken(token);
    if (!userId) {
      return NextResponse.redirect(appUrl("/login"));
    }

    const sessionToken = await issueSessionToken(userId);
    const response = NextResponse.redirect(new URL(next, url.origin));
    response.headers.set("Location", new URL(next, url.origin).toString());
    response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.redirect(appUrl("/login"));
  }
}
