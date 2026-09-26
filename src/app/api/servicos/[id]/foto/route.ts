import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { findCompanyService } from "@/lib/services";
import { removeCompanyImage, UploadError, uploadCompanyImage } from "@/lib/storage";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const service = await findCompanyService(prisma, auth.company.id, Number((await context.params).id));
  if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Escolha uma foto." }, { status: 400 });
  }

  try {
    const imagePath = await uploadCompanyImage({ companyId: auth.company.id, kind: "service", serviceId: service.id, file });
    await prisma.service.update({ where: { id: service.id }, data: { imagePath } });
    await removeCompanyImage(auth.company.id, service.imagePath).catch(() => false);
    return NextResponse.json({ ok: true, imagePath });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("[servico] falha no upload");
    return NextResponse.json({ error: "Não foi possível enviar a foto." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const service = await findCompanyService(prisma, auth.company.id, Number((await context.params).id));
  if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  await prisma.service.update({ where: { id: service.id }, data: { imagePath: null } });
  await removeCompanyImage(auth.company.id, service.imagePath).catch(() => false);
  return NextResponse.json({ ok: true });
}
