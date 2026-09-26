import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { reorderCompanyServices } from "@/lib/services";

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const result = await reorderCompanyServices(prisma, auth.company.id, body.ids);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
