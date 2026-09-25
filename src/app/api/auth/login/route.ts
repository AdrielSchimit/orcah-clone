import { NextResponse } from "next/server";
import { authenticateLogin } from "@/lib/auth-login";
import { createSession } from "@/lib/session";
import { sessionCookieIsShared } from "@/lib/urls";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };

  const result = await authenticateLogin({
    email: body.email ?? "",
    password: body.password ?? "",
    headers: request.headers,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await createSession(result.user.id);
  return NextResponse.json({
    ok: true,
    next: result.user.hasCompany ? (sessionCookieIsShared() ? "/entrando" : "/painel") : "/onboarding",
  });
}
