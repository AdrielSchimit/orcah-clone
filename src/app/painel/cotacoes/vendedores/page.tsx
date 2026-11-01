import Link from "next/link";
import { SuppliersPanel } from "@/components/suppliers-panel";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function VendedoresPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const suppliers = await prisma.supplier.findMany({
    where: { companyId: user.company.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, store: true, whatsapp: true },
  });

  return (
    <>
      <Link href="/painel/cotacoes" className="mb-2 inline-flex min-h-12 items-center text-sm font-medium text-text-soft">
        ← Cotações
      </Link>
      <SuppliersPanel suppliers={suppliers} />
    </>
  );
}
