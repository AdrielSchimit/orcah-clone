import Link from "next/link";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function CotacoesPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const quotes = await prisma.productQuote.findMany({
    where: { companyId: user.company.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      items: { orderBy: { position: "asc" }, take: 3, select: { description: true } },
      suppliers: { select: { respondedAt: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Cotações</h1>
        <Link
          href="/painel/cotacoes/nova"
          className="flex min-h-12 items-center rounded-btn bg-gold px-4 text-sm font-semibold text-ink"
        >
          + Nova cotação
        </Link>
      </div>
      <Link
        href="/painel/cotacoes/vendedores"
        className="mb-4 flex min-h-12 items-center justify-center rounded-btn border border-line bg-card text-sm font-medium"
      >
        Vendedores e lojas
      </Link>

      {quotes.length === 0 ? (
        <p className="text-sm text-text-soft">
          Nenhuma cotação ainda. Monte a lista de material e mande para os vendedores de uma vez.
        </p>
      ) : (
        <ul className="space-y-2">
          {quotes.map((quote) => {
            const answered = quote.suppliers.filter((row) => row.respondedAt).length;
            const names = quote.items.map((item) => item.description).join(", ");
            const more = quote._count.items - quote.items.length;
            return (
              <li key={quote.id}>
                <Link
                  href={`/painel/cotacoes/${quote.id}`}
                  className="block rounded-box border border-line bg-card p-4 hover:border-ink-line"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-text-soft">{formatDate(quote.createdAt)}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        quote.status === "reserved" ? "bg-ok-wash text-ok" : "bg-gold-wash text-gold-deep"
                      }`}
                    >
                      {quote.status === "reserved" ? "Reservada" : "Aberta"}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-medium">
                    {names}
                    {more > 0 ? ` +${more}` : ""}
                  </p>
                  <p className="text-sm text-text-soft">
                    {answered} de {quote.suppliers.length} {quote.suppliers.length === 1 ? "vendedor respondeu" : "vendedores responderam"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
