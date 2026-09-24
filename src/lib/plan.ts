import { NextResponse } from "next/server";
import { isPreviewAdmin } from "@/lib/admin";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { PLAN_PRICE, PLAN_PRICE_LABEL, TRIAL_DAYS } from "@/lib/plan-constants";

export { PLAN_PRICE, PLAN_PRICE_LABEL, TRIAL_DAYS } from "@/lib/plan-constants";

export async function ensureSubscription(companyId: number) {
  const existing = await prisma.subscription.findUnique({ where: { companyId } });
  if (existing) return existing;

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + TRIAL_DAYS);

  return prisma.subscription.create({
    data: {
      companyId,
      provider: "local",
      status: "trialing",
      plan: "unico",
      amount: PLAN_PRICE,
      startsAt,
      endsAt,
    },
  });
}

export function planView(
  subscription: {
    status: string;
    endsAt: Date | null;
    amount?: { toString(): string } | number | string;
  },
  options?: { isAdmin?: boolean },
) {
  if (options?.isAdmin) {
    return {
      ok: true,
      kind: "admin" as const,
      daysLeft: 0,
      label: "Conta de análise",
      detail: "Todos os moldes. Sem trial e sem cobrança.",
    };
  }

  const now = new Date();
  const endsAt = subscription.endsAt ? new Date(subscription.endsAt) : null;
  const activePaid = subscription.status === "active" && (!endsAt || endsAt > now);
  const trialOk = subscription.status === "trialing" && endsAt && endsAt > now;
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000)) : 0;

  if (activePaid) {
    return {
      ok: true,
      kind: "active" as const,
      daysLeft,
      label: `Plano único · ${PLAN_PRICE_LABEL}`,
      detail: endsAt ? `Renovação em ${endsAt.toLocaleDateString("pt-BR")}` : "Assinatura ativa",
    };
  }

  if (trialOk) {
    return {
      ok: true,
      kind: "trial" as const,
      daysLeft,
      label: `${daysLeft} dia(s) de teste`,
      detail: `Depois: ${PLAN_PRICE_LABEL}. Um plano só.`,
    };
  }

  return {
    ok: false,
    kind: "expired" as const,
    daysLeft: 0,
    label: "Teste encerrado",
    detail: `Assine o plano único por ${PLAN_PRICE_LABEL} para continuar.`,
  };
}

export async function requireActivePlan() {
  const auth = await requireCompany();
  if ("error" in auth) return auth;
  if (isPreviewAdmin(auth.user)) return auth;

  const subscription = await ensureSubscription(auth.company.id);
  const plan = planView(subscription);
  if (!plan.ok) {
    return {
      error: NextResponse.json(
        { error: "Assine o plano para continuar.", code: "plan" },
        { status: 402 },
      ),
    };
  }
  return auth;
}
