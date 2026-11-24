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

  if (quote.status !== "open") return NextResponse.json({ error: "Cotação já reservada." }, { status: 409 });
  const body = (await request.json().catch(() => ({}))) as { offerIds?: unknown } | null;
  const wanted = new Set(parseIdList(body?.offerIds));
  // só ofertas com preço desta cotação; cada item fica com um vendedor só
  const chosen = new Map<number, number>();
  for (const offer of quote.suppliers.flatMap((row) => row.offers)) {
    if (wanted.has(offer.id) && offer.unitPrice != null && !chosen.has(offer.itemId)) chosen.set(offer.itemId, offer.id);
  }
  const selectedIds = [...chosen.values()];
  if (!selectedIds.length) {
    return NextResponse.json({ error: "Escolha pelo menos um item." }, { status: 400 });
  }

  const reserved = await prisma.$transaction(async tx => {
    const claim = await tx.productQuote.updateMany({ where: { id: quote.id, companyId: auth.company.id, status: "open" }, data: { status: "open" } });
    if (!claim.count) return false;
    const current = await tx.productQuoteOffer.findMany({ where: { id: { in: selectedIds }, quoteSupplier: { quoteId: quote.id } } });
    const expected = new Map(quote.suppliers.flatMap(row => row.offers).filter(offer => selectedIds.includes(offer.id)).map(offer => [offer.id, offer]));
    if (current.length !== selectedIds.length || current.some(offer => { const old = expected.get(offer.id); return !old || offer.unitPrice == null || Number(offer.unitPrice) !== Number(old.unitPrice) || offer.brand !== old.brand; })) return false;
    await tx.productQuote.update({ where: { id: quote.id }, data: { status: "reserved", reservedAt: new Date() } });
    await tx.productQuoteOffer.updateMany({ where: { quoteSupplier: { quoteId: quote.id } }, data: { selected: false } });
    await tx.productQuoteOffer.updateMany({ where: { id: { in: selectedIds }, quoteSupplier: { quoteId: quote.id } }, data: { selected: true } });
    return true;
  });
  if (!reserved) return NextResponse.json({ error: "A cotação mudou ou já foi reservada. Atualize a página." }, { status: 409 });

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
