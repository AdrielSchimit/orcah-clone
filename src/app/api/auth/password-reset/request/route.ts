import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const result = await requestPasswordReset({
    email: body.email ?? "",
    headers: request.headers,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
