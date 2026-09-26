import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { removeCompanyImage } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }
  const photo = await prisma.companyPhoto.findFirst({
    where: { id, companyId: auth.company.id },
  });
  if (!photo) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  await prisma.companyPhoto.delete({ where: { id: photo.id } });
  await removeCompanyImage(auth.company.id, photo.path).catch(() => false);
  return NextResponse.json({ ok: true });
}
