import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/upload";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const budgetId = Number((await context.params).id);
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, companyId: auth.company.id },
    select: { id: true, status: true },
  });
  if (!budget) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }
  if (budget.status !== "draft" && budget.status !== "waiting") {
    return NextResponse.json({ error: "Só dá para anexar foto em rascunho." }, { status: 409 });
  }

  const count = await prisma.budgetPhoto.count({ where: { budgetId: budget.id } });
  if (count >= 8) {
    return NextResponse.json({ error: "Limite de 8 fotos neste orçamento." }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Escolha uma foto." }, { status: 400 });
  }

  const caption = String(form.get("caption") ?? "").trim();
  try {
    const path = await saveUpload(file, `orcamentos/${auth.company.id}/${budget.id}`);
    const photo = await prisma.budgetPhoto.create({
      data: {
        budgetId: budget.id,
        path,
        caption: caption || null,
        sortOrder: count,
      },
    });
    return NextResponse.json({ ok: true, photo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível enviar a foto." },
      { status: 400 },
    );
  }
}
