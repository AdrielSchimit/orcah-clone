import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { removeUpload } from "@/lib/upload";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  const photo = await prisma.companyPhoto.findFirst({
    where: { id, companyId: auth.company.id },
  });
  if (!photo) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  await prisma.companyPhoto.delete({ where: { id: photo.id } });
  await removeUpload(photo.path);
  return NextResponse.json({ ok: true });
}
