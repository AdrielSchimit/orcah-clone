import { NextResponse } from "next/server";
import { findOrCreateCity } from "@/lib/city";
import { prisma } from "@/lib/db";
import { digitsOnly } from "@/lib/whatsapp";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const slug = (await context.params).slug;
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  }

  const body = (await request.json()) as {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    desiredService?: string;
    description?: string;
    neighborhood?: string;
    preferredTime?: string;
    stateId?: number | string;
    cityName?: string;
  };

  const customerName = body.customerName?.trim() ?? "";
  const customerPhone = digitsOnly(body.customerPhone ?? "");
  if (customerName.length < 2) {
    return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }
  if (customerPhone.length < 8) {
    return NextResponse.json({ error: "Informe o WhatsApp." }, { status: 400 });
  }

  const stateId = body.stateId ? Number(body.stateId) : null;
  if (stateId) {
    const state = await prisma.state.findUnique({ where: { id: stateId } });
    if (!state) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
  }

  const city = stateId ? await findOrCreateCity(stateId, body.cityName ?? "") : null;

  const lead = await prisma.quoteRequest.create({
    data: {
      companyId: company.id,
      customerName,
      customerPhone,
      customerEmail: body.customerEmail?.trim().toLowerCase() || null,
      desiredService: body.desiredService?.trim() || null,
      description: body.description?.trim() || null,
      neighborhood: body.neighborhood?.trim() || null,
      preferredTime: body.preferredTime?.trim() || null,
      stateId,
      cityId: city?.id ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id });
}
