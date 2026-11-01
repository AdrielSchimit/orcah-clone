import Link from "next/link";
import { ProductQuoteForm } from "@/components/product-quote-form";
import { WhatsAppRobotPrompt } from "@/components/whatsapp-robot";
import { prisma } from "@/lib/db";
import { showRobotPrompt } from "@/lib/evolution";
import { getSessionUser } from "@/lib/session";

export default async function NovaCotacaoPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const [suppliers, recent] = await Promise.all([
    prisma.supplier.findMany({
      where: { companyId: user.company.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, store: true, whatsapp: true },
    }),
    // histórico: os produtos já cotados, mais recentes primeiro
    prisma.productQuoteItem.findMany({
      where: { quote: { companyId: user.company.id } },
      orderBy: { id: "desc" },
      distinct: ["description"],
      take: 30,
      select: { description: true, quantity: true },
    }),
  ]);

  return (
    <>
      <WhatsAppRobotPrompt show={showRobotPrompt(user.company)} />
      <Link href="/painel/cotacoes" className="mb-2 inline-flex min-h-12 items-center text-sm font-medium text-text-soft">
        ← Cotações
      </Link>
      <h1 className="mb-4 text-xl font-semibold">Nova cotação</h1>
      <ProductQuoteForm
        suppliers={suppliers}
        recent={recent.map((item) => ({ description: item.description, quantity: Number(item.quantity) }))}
      />
    </>
  );
}
