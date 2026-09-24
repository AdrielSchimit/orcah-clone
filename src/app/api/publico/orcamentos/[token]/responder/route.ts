import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findPublicBudget, isClosed, maybeExpire, recordBudgetEvent } from "@/lib/public-budget";

const rejectReasons = new Set([
  "preco",
  "prazo",
  "nao-sera-realizado",
  "outra-empresa",
  "outro",
]);

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
    return NextResponse.json({ error: "Este orçamento expirou." }, { status: 409 });
  }

  if (isClosed(budget.status)) {
    return NextResponse.json({ error: "Este orçamento já foi respondido." }, { status: 409 });
  }

  const body = (await request.json()) as {
    action?: string;
    reason?: string;
    message?: string;
  };

  if (body.action === "approve") {
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: "approved", approvedAt: new Date() },
    });
    await recordBudgetEvent(request, budget.id, "approved");
    return NextResponse.json({ ok: true, status: "approved" });
  }

  if (body.action === "reject") {
    const reason = body.reason?.trim() ?? "";
    if (!rejectReasons.has(reason)) {
      return NextResponse.json({ error: "Escolha o motivo da recusa." }, { status: 400 });
    }
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: "rejected", rejectedAt: new Date() },
    });
    await recordBudgetEvent(request, budget.id, "rejected", {
      reason,
      message: body.message?.trim() || null,
    });
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  if (body.action === "revision") {
    const message = body.message?.trim() ?? "";
    if (message.length < 3) {
      return NextResponse.json({ error: "Escreva o que gostaria de alterar." }, { status: 400 });
    }
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: "waiting" },
    });
    await recordBudgetEvent(request, budget.id, "revision_requested", { message });
    return NextResponse.json({ ok: true, status: "waiting" });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
