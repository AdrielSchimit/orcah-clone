import { NextResponse } from "next/server";

export async function GET() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) return NextResponse.json({ configured: false }, { status: 500 });

  try {
    const url = new URL(value);
    return NextResponse.json({
      configured: true,
      hostname: url.hostname,
      port: url.port || null,
      username: decodeURIComponent(url.username).replace(/^[^.]+/, "<role>"),
      pooled: url.hostname.includes("pooler.supabase.com"),
    });
  } catch {
    return NextResponse.json({ configured: true, parseable: false }, { status: 500 });
  }
}
