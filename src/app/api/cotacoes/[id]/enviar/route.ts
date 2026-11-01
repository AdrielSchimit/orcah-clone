import { NextResponse } from "next/server";
import { parseId } from "@/lib/crm";
import { prisma } from "@/lib/db";
import { robotSend } from "@/lib/evolution";
import { requireActivePlan } from "@/lib/plan";
import { quoteRequestMessage, quoteSupplierUrl } from "@/lib/product-quote";
import { whatsappHref } from "@/lib/whatsapp";

/** Sem quoteSupplierId manda para todos pelo robô. Com ele, devolve o link do WhatsApp daquele vendedor. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireActivePlan();
  if ("error" in auth) return auth.error;

  const id = parseId((await context.params).id);
  const body = (await request.json().catch(() => ({}))) as { quoteSupplierId?: unknown };
  const only = body.quoteSupplierId == null ? null : Number(body.quoteSupplierId);
  const quote = id
    ? await prisma.productQuote.findFirst({
        where: { id, companyId: auth.company.id },
        include: {
          _count: { select: { items: true } },
          suppliers: { include: { supplier: { select: { name: true, whatsapp: true } } }, orderBy: { id: "asc" } },
        },
      })
    : null;
  if (!quote) {
    return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  }

  const targets = quote.suppliers.filter((row) => only == null || row.id === only);
  if (!targets.length) {
    return NextResponse.json({ error: "Vendedor não encontrado." }, { status: 404 });
  }

  const results = [];
  for (const row of targets) {
    const message = quoteRequestMessage({
      supplierName: row.supplier.name,
      companyName: auth.company.name,
      itemCount: quote._count.items,
      url: quoteSupplierUrl(row.publicToken),
    });
    const href = whatsappHref(row.supplier.whatsapp, message);
    const sent = only == null && (await robotSend(auth.company, row.supplier.whatsapp, message));
    if (sent || only != null) {
      await prisma.productQuoteSupplier.update({ where: { id: row.id }, data: { sentAt: new Date() } });
    }
    results.push({ id: row.id, name: row.supplier.name, href, message, sent });
  }
  return NextResponse.json({ ok: true, results });
}
