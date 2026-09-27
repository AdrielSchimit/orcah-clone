import { NextResponse } from "next/server";
import { registerUser } from "@/lib/registration";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await registerUser({ body, headers: request.headers });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
