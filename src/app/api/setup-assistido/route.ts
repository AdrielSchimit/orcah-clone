import { NextResponse } from "next/server";
import { findActiveAssistedSetup, requestAssistedSetup } from "@/lib/assisted-setup";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ request: await findActiveAssistedSetup(prisma, auth.company.id) });
}

export async function POST(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => ({}))) as { notes?: unknown };
  const result = await requestAssistedSetup(prisma, auth.company.id, body.notes);
  return NextResponse.json({ ok: true, ...result });
}
