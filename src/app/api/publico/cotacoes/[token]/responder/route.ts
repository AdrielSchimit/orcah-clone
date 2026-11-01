import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseOfferPrice } from "@/lib/product-quote";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const token = (await context.params).token;
  const row = await prisma.productQuoteSupplier.findUnique({
    where: { publicToken: token },
    include: { quote: { select: { status: true, items: { select: { id: true } } } } },
  });
  if (!row) {
    return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  }
  if (row.quote.status !== "open") {
    return NextResponse.json({ error: "Essa cotação já foi fechada." }, { status: 409 });
  }

  const body = (await request.json().catch(() => ({}))) as { offers?: unknown };
  const input = Array.isArray(body.offers) ? (body.offers as { itemId?: unknown; brand?: unknown; unitPrice?: unknown }[]) : [];
  const itemIds = new Set(row.quote.items.map((item) => item.id));
  const offers = input
    .map((offer) => ({
      itemId: Number(offer?.itemId),
      brand: String(offer?.brand ?? "").trim().slice(0, 80) || null,
      unitPrice: parseOfferPrice(offer?.unitPrice),
    }))
    .filter((offer) => itemIds.has(offer.itemId));
  if (!offers.some((offer) => offer.unitPrice != null)) {
    return NextResponse.json({ error: "Coloque o valor de pelo menos um item." }, { status: 400 });
  }

  await prisma.$transaction([
    ...offers.map((offer) =>
      prisma.productQuoteOffer.upsert({
        where: { quoteSupplierId_itemId: { quoteSupplierId: row.id, itemId: offer.itemId } },
        create: { quoteSupplierId: row.id, ...offer },
        update: { brand: offer.brand, unitPrice: offer.unitPrice },
      }),
    ),
    prisma.productQuoteSupplier.update({ where: { id: row.id }, data: { respondedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
