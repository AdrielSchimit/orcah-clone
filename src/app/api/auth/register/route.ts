import { NextResponse } from "next/server";
import { registerUser } from "@/lib/registration";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await registerUser({ body, headers: request.headers });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  if (result.next === "/onboarding") {
    await createSession(result.userId);
    return NextResponse.json({ ok: true, next: result.next });
  }
  return NextResponse.json(result);
}
