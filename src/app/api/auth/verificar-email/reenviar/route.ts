import { NextResponse } from "next/server";
import { requestVerificationResend } from "@/lib/email-verification";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const result = await requestVerificationResend({ email: String(body.email ?? ""), headers: request.headers });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, message: result.message });
}
