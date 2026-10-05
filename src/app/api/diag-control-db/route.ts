import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    console.error("[diag-control-db] DATABASE_URL ausente");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  try {
    const url = new URL(raw);
    const username = decodeURIComponent(url.username);
    const suffix = username.includes(".") ? username.slice(username.indexOf(".")) : "";
    console.log("[diag-control-db]", { host: url.hostname, port: url.port || null, usernameSuffix: suffix, pooler: url.hostname.includes("pooler.supabase.com") });
    return NextResponse.json({ ok: true });
  } catch {
    console.error("[diag-control-db] DATABASE_URL invalida");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
