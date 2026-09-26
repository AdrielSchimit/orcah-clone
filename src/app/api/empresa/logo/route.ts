import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { removeCompanyImage, UploadError, uploadCompanyImage } from "@/lib/storage";

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Escolha uma logo." }, { status: 400 });
  }

  try {
    const logoPath = await uploadCompanyImage({ companyId: auth.company.id, kind: "logo", file });
    const previous = auth.company.logoPath;
    const company = await prisma.company.update({
      where: { id: auth.company.id },
      data: { logoPath },
    });
    await removeCompanyImage(auth.company.id, previous).catch(() => false);
    return NextResponse.json({ ok: true, logoPath: company.logoPath });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("[logo] falha no upload");
    return NextResponse.json({ error: "Não foi possível enviar a logo." }, { status: 500 });
  }
}
