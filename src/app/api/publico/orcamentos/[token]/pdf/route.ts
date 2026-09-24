import { NextResponse } from "next/server";
import { findPublicBudget } from "@/lib/public-budget";
import { buildBudgetPdf, pdfFileName } from "@/lib/pdf-budget";
import { companyTemplate } from "@/lib/templates";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const budget = await findPublicBudget((await context.params).token);
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
