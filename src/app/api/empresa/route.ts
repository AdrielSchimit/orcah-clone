import { NextResponse } from "next/server";
import { requireActivePlan } from "@/lib/plan";
import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireCompany();
  if ("error" in auth) return auth.error;
  return NextResponse.json(auth.company);
}

export async function PATCH(request: Request) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    description?: string;
    openingHours?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
    phone?: string;
    whatsapp?: string;
  };

  const company = await prisma.company.update({
    where: { id: auth.company.id },
    data: {
      description: body.description?.trim() || null,
      openingHours: body.openingHours?.trim() || null,
      instagram: body.instagram?.trim().replace(/^@/, "") || null,
      facebook: body.facebook?.trim() || null,
      website: body.website?.trim() || null,
      phone: body.phone?.replace(/\D/g, "") || auth.company.phone,
      whatsapp: body.whatsapp?.replace(/\D/g, "") || auth.company.whatsapp,
    },
  });

  return NextResponse.json({ ok: true, company });
}
