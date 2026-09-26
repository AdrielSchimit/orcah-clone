import { NextResponse } from "next/server";
import { findOrCreateCity } from "@/lib/city";
import { prisma } from "@/lib/db";
import { buildCompanyDescription, normalizeOnboardingPayload } from "@/lib/onboarding";
import { TRIAL_DAYS } from "@/lib/plan-constants";
import { createSession, getSessionUser } from "@/lib/session";
import { isReservedCompanySlug, sessionCookieIsShared } from "@/lib/urls";
import { slugify } from "@/lib/text";

function isUniqueConflict(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  const prismaError = error as { code?: string; meta?: { target?: string[] | string } };
  if (prismaError.code !== "P2002") return false;
  const target = prismaError.meta?.target;
  const targets = Array.isArray(target) ? target : [target ?? ""];
  return targets.some((item) => item === "user_id" || item === "userId" || item.includes("user_id"));
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login." }, { status: 401 });
  }
  if (user.company) {
    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      next: sessionCookieIsShared() ? "/entrando" : "/painel",
    });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const normalized = normalizeOnboardingPayload(body);

  if ("error" in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }
  const {
    name,
    whatsapp,
    businessCategoryId,
    customRamoName,
    stateId,
    cityName,
    servesRegion,
  } = normalized.payload;

  const [category, state] = await Promise.all([
    prisma.businessCategory.findFirst({ where: { id: businessCategoryId, active: true } }),
    prisma.state.findUnique({ where: { id: stateId } }),
  ]);

  if (!category || !state) {
    return NextResponse.json({ error: "Ramo ou estado inválidos." }, { status: 400 });
  }

  const city = await findOrCreateCity(state.id, cityName);
  const isOutro = category.slug === "outro";
  const ramoName = isOutro && customRamoName.length >= 2 ? customRamoName : category.name;
  const description =
    normalized.payload.description ||
    buildCompanyDescription({
      categoryName: ramoName,
      categorySlug: category.slug,
      customRamoName: isOutro ? customRamoName : null,
      cityName,
      servesRegion,
    });

  let slug = slugify(name) || "empresa";
  const taken = await prisma.company.findUnique({ where: { slug } });
  if (taken || isReservedCompanySlug(slug)) {
    slug = `${slug}-${user.id}`;
  }

  try {
    await prisma.company.create({
      data: {
        userId: user.id,
        name,
        tradeName: name,
        phone: whatsapp,
        whatsapp,
        email: user.email,
        businessCategoryId: category.id,
        customRamoName: isOutro && customRamoName.length >= 2 ? customRamoName : null,
        stateId: state.id,
        cityId: city?.id ?? null,
        servesRegion,
        description,
        slug,
        subscription: {
          create: {
            provider: "local",
            status: "trialing",
            plan: "unico",
            amount: "29.00",
            startsAt: new Date(),
            endsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
          },
        },
      },
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
  }

  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    next: sessionCookieIsShared() ? "/entrando" : "/painel",
  });
}
