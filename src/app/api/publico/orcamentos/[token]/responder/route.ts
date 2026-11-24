import type { BudgetStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { publicCanRespond } from "@/lib/budget-cycle";
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
    await prisma.budget.updateMany({ where: { id: budget.id, status: budget.status, updatedAt: budget.updatedAt }, data: { status: "expired" } });
    return NextResponse.json({ error: "Este orçamento expirou." }, { status: 409 });
  }

  if (isClosed(budget.status)) {
    return NextResponse.json({ error: "Este orçamento já foi respondido." }, { status: 409 });
  }
  if (!publicCanRespond(budget.status)) {
    // pedido de alteração em aberto: a resposta vale para a versão nova, depois do ajuste
    return NextResponse.json({ error: "A empresa está ajustando este orçamento. Aguarde a nova versão." }, { status: 409 });
  }

  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const body = raw as { action?: unknown; reason?: unknown; message?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > 4000) return NextResponse.json({ error: "Mensagem muito longa." }, { status: 400 });
  let status: BudgetStatus;
  let event: "approved" | "rejected" | "revision_requested";
  let metadata: Prisma.InputJsonValue | undefined;
  if (body.action === "approve") { status = "approved"; event = "approved"; }
  else if (body.action === "reject") {
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!rejectReasons.has(reason)) return NextResponse.json({ error: "Escolha o motivo da recusa." }, { status: 400 });
    status = "rejected"; event = "rejected"; metadata = { reason, message: message || null };
  } else if (body.action === "revision") {
    if (message.length < 3) return NextResponse.json({ error: "Escreva o que gostaria de alterar." }, { status: 400 });
    status = "waiting"; event = "revision_requested"; metadata = { message };
  } else return NextResponse.json({ error: "Ação inválida." }, { status: 400 });

  const changed = await prisma.$transaction(async tx => {
    const result = await tx.budget.updateMany({
      where: { id: budget.id, status: budget.status, updatedAt: budget.updatedAt },
      data: { status, ...(status === "approved" ? { approvedAt: new Date() } : {}), ...(status === "rejected" ? { rejectedAt: new Date() } : {}) },
    });
    if (!result.count) return false;
    await recordBudgetEvent(request, budget.id, event, metadata, tx);
    return true;
  });
  if (!changed) return NextResponse.json({ error: "O orçamento mudou. Atualize a página antes de responder." }, { status: 409 });
  return NextResponse.json({ ok: true, status });
}
