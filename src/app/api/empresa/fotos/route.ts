import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/upload";

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const photos = await prisma.companyPhoto.findMany({
    where: { companyId: auth.company.id, active: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const count = await prisma.companyPhoto.count({
    where: { companyId: auth.company.id, active: true },
  });
  if (count >= 12) {
    return NextResponse.json({ error: "Limite de 12 fotos na galeria." }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Escolha uma foto." }, { status: 400 });
  }

  try {
    const path = await saveUpload(file, `empresa/${auth.company.id}`);
    const photo = await prisma.companyPhoto.create({
      data: {
        companyId: auth.company.id,
        path,
        title: String(form.get("title") ?? "").trim() || null,
        description: String(form.get("description") ?? "").trim() || null,
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
