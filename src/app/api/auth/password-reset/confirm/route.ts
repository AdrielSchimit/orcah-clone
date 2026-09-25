import { NextResponse } from "next/server";
import { confirmPasswordReset } from "@/lib/password-reset";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { token?: string; password?: string };
  const result = await confirmPasswordReset({
    token: body.token ?? "",
    password: body.password ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, reason: result.reason }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
