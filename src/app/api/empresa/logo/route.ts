import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { removeUpload, saveUpload } from "@/lib/upload";

export async function POST(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Escolha uma logo." }, { status: 400 });
  }

  try {
    const path = await saveUpload(file, `empresa/${auth.company.id}/logo`);
    if (auth.company.logoPath) await removeUpload(auth.company.logoPath);
    const company = await prisma.company.update({
      where: { id: auth.company.id },
      data: { logoPath: path },
    });
    return NextResponse.json({ ok: true, logoPath: company.logoPath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível enviar a logo." },
      { status: 400 },
    );
  }
}
