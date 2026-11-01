import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductQuoteCompare, type SendResult } from "@/components/product-quote-compare";
import { WhatsAppRobotPrompt } from "@/components/whatsapp-robot";
import { parseId } from "@/lib/crm";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/db";
import { evolutionEnabled, showRobotPrompt } from "@/lib/evolution";
import { reservationMessage } from "@/lib/product-quote";
import { getSessionUser } from "@/lib/session";
import { whatsappHref } from "@/lib/whatsapp";

export default async function CotacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const id = parseId((await params).id);
  const quote = id
    ? await prisma.productQuote.findFirst({
        where: { id, companyId: user.company.id },
        include: {
          items: { orderBy: { position: "asc" } },
          suppliers: {
            orderBy: { id: "asc" },
            include: { supplier: { select: { name: true, store: true, whatsapp: true } }, offers: true },
          },
        },
      })
    : null;
  if (!quote) notFound();

  const items = quote.items.map((item) => ({ id: item.id, description: item.description, quantity: Number(item.quantity) }));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const offers = quote.suppliers.flatMap((row) =>
    row.offers.map((offer) => ({
      id: offer.id,
      itemId: offer.itemId,
      quoteSupplierId: row.id,
      brand: offer.brand,
      unitPrice: offer.unitPrice == null ? null : Number(offer.unitPrice),
      selected: offer.selected,
    })),
  );

  let reserved: SendResult[] | null = null;
  if (quote.status === "reserved") {
    reserved = [];
    for (const row of quote.suppliers) {
      const lines = offers
        .filter((offer) => offer.quoteSupplierId === row.id && offer.selected && offer.unitPrice != null)
        .map((offer) => {
          const item = itemById.get(offer.itemId)!;
          return { description: item.description, quantity: item.quantity, brand: offer.brand, unitPrice: offer.unitPrice as number };
        });
      if (!lines.length) continue;
      const message = reservationMessage({ supplierName: row.supplier.name, companyName: user.company.name, lines });
      reserved.push({ id: row.id, name: row.supplier.name, href: whatsappHref(row.supplier.whatsapp, message), sent: false });
    }
  }

  return (
    <>
      <WhatsAppRobotPrompt show={showRobotPrompt(user.company)} />
      <Link href="/painel/cotacoes" className="mb-2 inline-flex min-h-12 items-center text-sm font-medium text-text-soft">
        ← Cotações
      </Link>
      <h1 className="text-xl font-semibold">Cotação de {formatDate(quote.createdAt)}</h1>
      <p className="mb-4 text-sm text-text-soft">
        {items.length} {items.length === 1 ? "produto" : "produtos"} · {quote.status === "reserved" ? "Reservada" : "Aberta"}
      </p>
      <ProductQuoteCompare
        quoteId={quote.id}
        robot={evolutionEnabled() && user.company.whatsappRobot}
        items={items}
        suppliers={quote.suppliers.map((row) => ({
          id: row.id,
          name: row.supplier.name,
          store: row.supplier.store,
          sent: Boolean(row.sentAt),
          responded: Boolean(row.respondedAt),
        }))}
        offers={offers}
        reserved={reserved}
      />
    </>
  );
}
