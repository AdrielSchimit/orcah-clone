import { timingSafeEqual } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { familiasAgrupadas, inventarioRamos, previewCliente } from "@/lib/ramo-catalogo";
import { ramoMoldes } from "@/lib/ramo-moldes";
import { ServiceCoverPlaceholder } from "@/components/service-cover-placeholder";
import { resolveServiceCoverTheme } from "@/lib/service-cover-themes";

export const dynamic = "force-dynamic";

type ControlAction =
  | "health"
  | "dashboard"
  | "companies"
  | "company"
  | "users"
  | "budgets"
  | "budget"
  | "subscriptions"
  | "events"
  | "templates";

type ControlRequest = {
  action?: ControlAction;
  params?: Record<string, unknown>;
};

function authorized(request: Request) {
  const expected = process.env.CONTROL_INTERNAL_SECRET?.trim() ?? "";
  const received = request.headers.get("x-orcah-control-secret")?.trim() ?? "";
  if (expected.length < 32 || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function id(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ControlRequest;
  try {
    body = (await request.json()) as ControlRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const params = body.params ?? {};

  try {
    switch (body.action) {
      case "health": {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ ok: true });
      }

      case "dashboard": {
        const since30 = new Date();
        since30.setDate(since30.getDate() - 29);
        since30.setHours(0, 0, 0, 0);

        const [
          companyCount,
          userCount,
          budgetCount,
          subscriptions,
          recentUsers,
          recentCompanies,
          budgetsByStatus,
          budgetTotals,
          approved,
        ] = await Promise.all([
          prisma.company.count(),
          prisma.user.count(),
          prisma.budget.count(),
          prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
          prisma.user.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
          prisma.company.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
          prisma.budget.groupBy({ by: ["status"], _count: { _all: true } }),
          prisma.budget.aggregate({ _sum: { total: true } }),
          prisma.budget.aggregate({ where: { status: "approved" }, _sum: { total: true } }),
        ]);

        return NextResponse.json({
          companyCount,
          userCount,
          budgetCount,
          subscriptions,
          recentUsers,
          recentCompanies,
          budgetsByStatus,
          budgetTotals,
          approved,
        });
      }

      case "companies": {
        const q = text(params.q);
        const status = text(params.status);
        const where: Prisma.CompanyWhereInput = {};

        if (q) {
          where.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { whatsapp: { contains: q } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ];
        }
        if (status === "trial") where.subscription = { status: "trialing" };
        if (status === "active") where.subscription = { status: "active" };
        if (status === "none") where.subscription = null;

        const rows = await prisma.company.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            user: { select: { name: true, email: true } },
            city: { select: { name: true } },
            state: { select: { uf: true } },
            businessCategory: { select: { name: true } },
            subscription: true,
          },
        });
        return NextResponse.json({ rows });
      }

      case "company": {
        const companyId = id(params.id);
        if (!companyId) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

        const company = await prisma.company.findUnique({
          where: { id: companyId },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
            city: { select: { name: true } },
            state: { select: { name: true, uf: true } },
            businessCategory: { select: { name: true } },
            subscription: true,
          },
        });
        if (!company) return NextResponse.json({ row: null });

        const [customers, budgets, total, recentBudgets] = await Promise.all([
          prisma.customer.count({ where: { companyId } }),
          prisma.budget.count({ where: { companyId } }),
          prisma.budget.aggregate({ where: { companyId }, _sum: { total: true } }),
          prisma.budget.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { customer: { select: { name: true } } },
          }),
        ]);
        return NextResponse.json({ row: { company, customers, budgets, total: total._sum.total, recentBudgets } });
      }

      case "users": {
        const q = text(params.q);
        const rows = await prisma.user.findMany({
          where: q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            company: { select: { id: true, name: true } },
          },
        });
        return NextResponse.json({ rows });
      }

      case "budgets": {
        const q = text(params.q);
        const status = text(params.status);
        const where: Prisma.BudgetWhereInput = {};
        if (status) where.status = status as Prisma.EnumBudgetStatusFilter["equals"];
        if (q) {
          where.OR = [
            { number: { contains: q, mode: "insensitive" } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
            { company: { name: { contains: q, mode: "insensitive" } } },
          ];
        }
        const rows = await prisma.budget.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            company: { select: { id: true, name: true } },
            customer: { select: { name: true } },
          },
        });
        return NextResponse.json({ rows });
      }

      case "budget": {
        const budgetId = id(params.id);
        if (!budgetId) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
        const row = await prisma.budget.findUnique({
          where: { id: budgetId },
          include: {
            company: { select: { id: true, name: true } },
            customer: { select: { name: true, phone: true, email: true } },
            items: true,
            events: { orderBy: { createdAt: "desc" } },
          },
        });
        return NextResponse.json({ row });
      }

      case "subscriptions": {
        const rows = await prisma.subscription.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { company: { select: { id: true, name: true } } },
        });
        return NextResponse.json({ rows });
      }

      case "events": {
        const rows = await prisma.budgetEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            budget: {
              select: {
                id: true,
                number: true,
                company: { select: { id: true, name: true } },
              },
            },
          },
        });
        return NextResponse.json({ rows });
      }

      case "templates": {
        const rows = inventarioRamos().map((ramo) => {
          const molde = ramoMoldes[ramo.slug];
          const theme = resolveServiceCoverTheme(ramo.slug);
          const coverMarkup = renderToStaticMarkup(
            createElement(ServiceCoverPlaceholder, { category: ramo.slug }),
          );
          const coverSvg = coverMarkup.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? "";

          return {
            ...ramo,
            preview: previewCliente(ramo.slug),
            exemplos: molde?.suggestions.slice(0, 5) ?? [],
            form: molde?.form ?? null,
            coverSvg,
            coverTheme: {
              background: theme.background,
              accent: theme.accent,
              icons: theme.icons,
              patternCount: theme.pattern.length,
            },
          };
        });

        return NextResponse.json({
          rows,
          familias: familiasAgrupadas(),
          catalog: {
            covers: 83,
            icons: 225,
            renderer: "src/components/service-cover-placeholder.tsx",
            themes: "src/lib/service-cover-themes.ts",
          },
        });
      }

      default:
        return NextResponse.json({ error: "unknown_action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[control-gateway] request failed", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "control_gateway_failed" }, { status: 500 });
  }
}
