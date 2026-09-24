import { NextResponse } from "next/server";
import { findOrCreateCity } from "@/lib/city";
import { prisma } from "@/lib/db";
import { TRIAL_DAYS } from "@/lib/plan-constants";
import { createSession, getSessionUser } from "@/lib/session";
import { isReservedCompanySlug, sessionCookieIsShared } from "@/lib/urls";
import { slugify, titleCaseName } from "@/lib/text";

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

  const body = (await request.json()) as {
    name?: string;
    whatsapp?: string;
    businessCategoryId?: number;
    customRamoName?: string;
    stateId?: number;
    cityName?: string;
    servesRegion?: boolean;
  };

  const name = body.name?.trim() ?? "";
  const whatsapp = body.whatsapp?.replace(/\D/g, "") ?? "";
  const businessCategoryId = Number(body.businessCategoryId);
  const stateId = Number(body.stateId);
  const customRamoName = titleCaseName(body.customRamoName ?? "");
  const servesRegion = Boolean(body.servesRegion);

  if (name.length < 2) {
    return NextResponse.json({ error: "Informe o nome da empresa." }, { status: 400 });
  }
  if (!whatsapp) {
    return NextResponse.json({ error: "Informe o WhatsApp." }, { status: 400 });
  }
  if (!businessCategoryId || !stateId) {
    return NextResponse.json({ error: "Escolha o ramo e o estado." }, { status: 400 });
  }

  const [category, state] = await Promise.all([
    prisma.businessCategory.findFirst({ where: { id: businessCategoryId, active: true } }),
    prisma.state.findUnique({ where: { id: stateId } }),
  ]);

  if (!category || !state) {
    return NextResponse.json({ error: "Ramo ou estado inválidos." }, { status: 400 });
  }

  const city = await findOrCreateCity(state.id, body.cityName ?? "");
  const isOutro = category.slug === "outro";

  let slug = slugify(name) || "empresa";
  const taken = await prisma.company.findUnique({ where: { slug } });
  if (taken || isReservedCompanySlug(slug)) {
    slug = `${slug}-${user.id}`;
  }

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

  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    next: sessionCookieIsShared() ? "/entrando" : "/painel",
  });
}
