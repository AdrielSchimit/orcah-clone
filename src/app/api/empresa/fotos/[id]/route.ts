import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { removeCompanyImage, uploadCompanyImage, UploadError } from "@/lib/storage";

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

export async function PATCH(_request: Request, context: {params: Promise<{id:string}>}) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({error:"Foto não encontrada."},{status:404});
  const { chooseCompanyCover } = await import("@/lib/company-cover");
  const found = await chooseCompanyCover(prisma, auth.company.id, id);
  if (!found) return NextResponse.json({error:"Foto não encontrada."},{status:404});
  return NextResponse.json({ok:true});
}

/**
 * Replace a gallery photo without creating a second row or losing its title/order.
 * Useful for records created on temporary /uploads disks before Supabase Storage.
 * The company and photo ID are always verified against the active session.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  const photo = await prisma.companyPhoto.findFirst({
    where: { id, companyId: auth.company.id, active: true },
  });
  if (!photo) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Escolha uma foto." }, { status: 400 });
  }

  let uploadedPath: string | null = null;
  try {
    uploadedPath = await uploadCompanyImage({ companyId: auth.company.id, kind: "gallery", file });
    const update = await prisma.companyPhoto.updateMany({
      where: { id: photo.id, companyId: auth.company.id, active: true, path: photo.path },
      data: { path: uploadedPath },
    });
    if (update.count !== 1) {
      await removeCompanyImage(auth.company.id, uploadedPath).catch(() => false);
      return NextResponse.json({ error: "A foto mudou enquanto você enviava. Recarregue a página." }, { status: 409 });
    }

    await removeCompanyImage(auth.company.id, photo.path).catch(() => false);
    return NextResponse.json({ ok: true, path: uploadedPath });
  } catch (error) {
    if (uploadedPath) await removeCompanyImage(auth.company.id, uploadedPath).catch(() => false);
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[galeria] falha ao substituir imagem");
    return NextResponse.json({ error: "Não foi possível substituir esta foto." }, { status: 500 });
  }
}
