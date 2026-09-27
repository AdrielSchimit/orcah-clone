import Link from "next/link";
import { ServiceForm } from "@/components/service-form";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function NovoServicoPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const categories = await prisma.service.findMany({
    where: { companyId: user.company.id, category: { not: null } },
    distinct: ["category"],
    select: { category: true },
    take: 30,
  });

  return (
    <>
      <Link href="/painel/servicos" className="mb-2 inline-flex min-h-10 items-center text-sm text-text-soft">
        ← Serviços
      </Link>
      <h1 className="mb-4 text-xl font-semibold">Novo serviço</h1>
      <ServiceForm categories={categories.map((row) => row.category!).filter(Boolean)} />
    </>
  );
}
