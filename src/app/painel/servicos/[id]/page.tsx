import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/service-form";
import { prisma } from "@/lib/db";
import { findCompanyService, serializeService } from "@/lib/services";
import { getSessionUser } from "@/lib/session";

export default async function EditarServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const service = await findCompanyService(prisma, user.company.id, Number((await params).id));
  if (!service) notFound();

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
      <h1 className="mb-4 text-xl font-semibold">Editar serviço</h1>
      <ServiceForm service={serializeService(service)} categories={categories.map((row) => row.category!).filter(Boolean)} />
    </>
  );
}
