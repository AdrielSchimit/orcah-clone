import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { serializeService, updateCompanyService } from "@/lib/services";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await updateCompanyService(prisma, auth.company.id, id, body);
  if ("notFound" in result) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, service: serializeService(result.service) });
}
