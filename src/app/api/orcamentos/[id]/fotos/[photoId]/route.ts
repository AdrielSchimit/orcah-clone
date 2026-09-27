import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { removeCompanyImage } from "@/lib/storage";
import { removeUpload } from "@/lib/upload";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; photoId: string }> },
) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const { id, photoId } = await context.params;
  const budgetId = Number(id);
  const photo = await prisma.budgetPhoto.findFirst({
    where: {
      id: Number(photoId),
      budget: { id: budgetId, companyId: auth.company.id },
    },
  });
  if (!photo) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  await prisma.budgetPhoto.delete({ where: { id: photo.id } });
  // fotos novas ficam no storage; as antigas, em /uploads/orcamentos/...
  const removed = await removeCompanyImage(auth.company.id, photo.path).catch(() => false);
  if (!removed) await removeUpload(photo.path);
  return NextResponse.json({ ok: true });
}
