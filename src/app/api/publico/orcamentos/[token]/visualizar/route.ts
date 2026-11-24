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
    const result = await prisma.budget.updateMany({ where: { id: budget.id, status: budget.status, updatedAt: budget.updatedAt }, data: { status: "expired" } });
    if (!result.count) return NextResponse.json({ error: "Orçamento atualizado." }, { status: 409 });
    return NextResponse.json({ ok: true, status: "expired" });
  }

  const user = await getSessionUser();
  if (user?.company?.id === budget.companyId) {
    return NextResponse.json({ ok: true, status: budget.status, preview: true });
  }

  if (isClosed(budget.status) || budget.status === "viewed" || budget.status === "waiting") {
    return NextResponse.json({ ok: true, status: budget.status });
  }

  const changed = await prisma.$transaction(async tx => {
    const result = await tx.budget.updateMany({
      where: { id: budget.id, status: budget.status, updatedAt: budget.updatedAt },
      data: { status: "viewed", viewedAt: budget.viewedAt ?? new Date() },
    });
    if (!result.count) return false;
    await recordBudgetEvent(request, budget.id, "viewed", undefined, tx);
    return true;
  });
  if (!changed) return NextResponse.json({ error: "Orçamento atualizado." }, { status: 409 });
  return NextResponse.json({ ok: true, status: "viewed" });
}
