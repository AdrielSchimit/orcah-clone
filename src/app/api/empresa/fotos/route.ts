import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { UploadError, uploadCompanyImage } from "@/lib/storage";

const GALLERY_LIMIT = 12;

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
  if (count >= GALLERY_LIMIT) {
    return NextResponse.json({ error: `Limite de ${GALLERY_LIMIT} fotos na galeria.` }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Escolha uma foto." }, { status: 400 });
  }

  try {
    const path = await uploadCompanyImage({ companyId: auth.company.id, kind: "gallery", file });
    const photo = await prisma.companyPhoto.create({
      data: {
        companyId: auth.company.id,
        path,
        title: String(form.get("title") ?? "").trim().slice(0, 120) || null,
        description: String(form.get("description") ?? "").trim().slice(0, 255) || null,
        sortOrder: count,
      },
    });
    return NextResponse.json({ ok: true, photo });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("[galeria] falha no upload");
    return NextResponse.json({ error: "Não foi possível enviar a foto." }, { status: 500 });
  }
}
