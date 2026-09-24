import { NextResponse } from "next/server";
import { isPreviewAdmin } from "@/lib/admin";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { titleCaseName } from "@/lib/text";

export async function POST(request: Request) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;
  if (!isPreviewAdmin(auth.user)) {
    return NextResponse.json({ error: "Só a conta de análise troca o molde." }, { status: 403 });
  }

  const body = (await request.json()) as {
    businessCategoryId?: number;
    customRamoName?: string;
  };

  const businessCategoryId = Number(body.businessCategoryId);
  if (!businessCategoryId) {
    return NextResponse.json({ error: "Escolha um ramo." }, { status: 400 });
  }

  const category = await prisma.businessCategory.findFirst({
    where: { id: businessCategoryId, active: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Ramo inválido." }, { status: 400 });
  }

  const isOutro = category.slug === "outro";
  const customRamoName = titleCaseName(body.customRamoName ?? "");

  const company = await prisma.company.update({
    where: { id: auth.company.id },
    data: {
      businessCategoryId: category.id,
      customRamoName: isOutro && customRamoName.length >= 2 ? customRamoName : null,
    },
    include: { businessCategory: true },
  });

  return NextResponse.json({ ok: true, company });
}
