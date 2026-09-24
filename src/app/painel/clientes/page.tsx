import { ClientesPanel } from "@/components/clientes-panel";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function ClientesPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const customers = await prisma.customer.findMany({
    where: { companyId: user.company.id },
    orderBy: { name: "asc" },
    include: {
      city: { select: { name: true } },
      state: { select: { uf: true } },
    },
  });

  return <ClientesPanel customers={customers} />;
}
