import { NextResponse } from "next/server";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { buildBudgetPdf, pdfFileName } from "@/lib/pdf-budget";
import { companyTemplate } from "@/lib/templates";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;

  const id = Number((await context.params).id);
  const budget = await prisma.budget.findFirst({
    where: { id, companyId: auth.company.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      serviceCity: { select: { name: true } },
      serviceState: { select: { uf: true } },
      company: { include: { businessCategory: true } },
    },
  });

  if (!budget) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  const pdf = await buildBudgetPdf(budget, companyTemplate(budget.company));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(budget.number)}"`,
    },
  });
}
