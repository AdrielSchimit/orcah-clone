import { NextResponse } from "next/server";
import { parseId } from "@/lib/crm";
import { prisma } from "@/lib/db";
import { robotSend } from "@/lib/evolution";
import { requireActivePlan } from "@/lib/plan";
import { parseIdList, reservationMessage } from "@/lib/product-quote";
import { whatsappHref } from "@/lib/whatsapp";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = parseId((await context.params).id);
  const quote = id
    ? await prisma.productQuote.findFirst({
        where: { id, companyId: auth.company.id },
        include: {
          suppliers: {
            orderBy: { id: "asc" },
            include: {
              supplier: { select: { name: true, whatsapp: true } },
              offers: { include: { item: true } },
            },
          },
        },
      })
    : null;
  if (!quote) {
    return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { offerIds?: unknown };
  const wanted = new Set(parseIdList(body.offerIds));
  // só ofertas com preço desta cotação; cada item fica com um vendedor só
  const chosen = new Map<number, number>();
  for (const offer of quote.suppliers.flatMap((row) => row.offers)) {
    if (wanted.has(offer.id) && offer.unitPrice != null && !chosen.has(offer.itemId)) chosen.set(offer.itemId, offer.id);
  }
  const selectedIds = [...chosen.values()];
  if (!selectedIds.length) {
    return NextResponse.json({ error: "Escolha pelo menos um item." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.productQuoteOffer.updateMany({ where: { quoteSupplier: { quoteId: quote.id } }, data: { selected: false } }),
    prisma.productQuoteOffer.updateMany({ where: { id: { in: selectedIds } }, data: { selected: true } }),
    prisma.productQuote.update({ where: { id: quote.id }, data: { status: "reserved", reservedAt: new Date() } }),
  ]);

  const results = [];
  for (const row of quote.suppliers) {
    const lines = row.offers
      .filter((offer) => selectedIds.includes(offer.id))
      .sort((a, b) => a.item.position - b.item.position)
      .map((offer) => ({
        description: offer.item.description,
        quantity: Number(offer.item.quantity),
        brand: offer.brand,
        unitPrice: Number(offer.unitPrice),
      }));
    if (!lines.length) continue;
    const message = reservationMessage({ supplierName: row.supplier.name, companyName: auth.company.name, lines });
    const sent = await robotSend(auth.company, row.supplier.whatsapp, message);
    results.push({ id: row.id, name: row.supplier.name, href: whatsappHref(row.supplier.whatsapp, message), message, sent });
  }
  return NextResponse.json({ ok: true, results });
}
