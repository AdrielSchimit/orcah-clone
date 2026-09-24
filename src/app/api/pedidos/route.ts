import { NextResponse } from "next/server";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const requests = await prisma.quoteRequest.findMany({
    where: { companyId: auth.company.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      city: { select: { name: true } },
      state: { select: { uf: true } },
    },
  });

  return NextResponse.json(requests);
}

export async function PATCH(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as { id?: number; status?: string };
  const id = Number(body.id);
  const status = body.status;
  if (!id || !["new", "contacted", "converted", "archived"].includes(status ?? "")) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const existing = await prisma.quoteRequest.findFirst({
    where: { id, companyId: auth.company.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const updated = await prisma.quoteRequest.update({
    where: { id },
    data: { status: status as "new" | "contacted" | "converted" | "archived" },
  });

  return NextResponse.json({ ok: true, request: updated });
}
