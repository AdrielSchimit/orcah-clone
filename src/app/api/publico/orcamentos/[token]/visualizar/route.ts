import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findPublicBudget, isClosed, maybeExpire, recordBudgetEvent } from "@/lib/public-budget";
import { getSessionUser } from "@/lib/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const token = (await context.params).token;
  const budget = await findPublicBudget(token);
  if (!budget) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  if (maybeExpire(budget.validityDate, budget.status)) {
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: "expired" },
    });
    return NextResponse.json({ ok: true, status: "expired" });
  }

  const user = await getSessionUser();
  if (user?.company?.id === budget.companyId) {
    return NextResponse.json({ ok: true, status: budget.status, preview: true });
  }

  if (isClosed(budget.status) || budget.status === "viewed" || budget.status === "waiting") {
    return NextResponse.json({ ok: true, status: budget.status });
  }

  await prisma.budget.update({
    where: { id: budget.id },
    data: {
      status: "viewed",
      viewedAt: budget.viewedAt ?? new Date(),
    },
  });
  await recordBudgetEvent(request, budget.id, "viewed");

  return NextResponse.json({ ok: true, status: "viewed" });
}
