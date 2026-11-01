import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrcahLogo } from "@/components/orcah-logo";
import { SupplierQuoteForm } from "@/components/supplier-quote-form";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Cotação", robots: { index: false, follow: false } };

export default async function PublicCotacaoPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const row = await prisma.productQuoteSupplier.findUnique({
    where: { publicToken: token },
    include: {
      supplier: { select: { name: true } },
      offers: true,
      quote: {
        select: {
          status: true,
          items: { orderBy: { position: "asc" } },
          company: { select: { name: true, logoPath: true } },
        },
      },
    },
  });
  if (!row) notFound();

  const { company } = row.quote;
  const offerByItem = new Map(row.offers.map((offer) => [offer.itemId, offer]));
  const items = row.quote.items.map((item) => {
    const offer = offerByItem.get(item.id);
    return {
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      brand: offer?.brand ?? "",
      unitPrice: offer?.unitPrice == null ? "" : Number(offer.unitPrice).toFixed(2).replace(".", ","),
    };
  });

  return (
    <main className="min-h-full bg-paper px-4 pb-10 pt-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-5 flex items-center gap-3">
          {company.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoPath} alt="" className="h-12 w-12 rounded-btn object-cover" />
          ) : null}
          <div className="min-w-0">
            <p className="text-sm text-text-soft">Pedido de cotação</p>
            <h1 className="truncate text-xl font-semibold">{company.name}</h1>
          </div>
        </div>
        <p className="mb-4 text-sm">
          Oi, {row.supplier.name.split(" ")[0]}! Coloque a marca e o valor de cada item e toque em{" "}
          <strong>Enviar cotação</strong>.
        </p>
        <SupplierQuoteForm token={token} items={items} closed={row.quote.status !== "open"} />
        <div className="mt-8 flex justify-center text-text-soft">
          <OrcahLogo className="h-6 w-auto" />
        </div>
      </div>
    </main>
  );
}
