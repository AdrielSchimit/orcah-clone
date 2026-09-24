import { PedidosList } from "@/components/pedidos-list";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function PedidosPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const pedidos = await prisma.quoteRequest.findMany({
    where: { companyId: user.company.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      city: { select: { name: true } },
      state: { select: { uf: true } },
    },
  });

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Pedidos de orçamento</h1>
      <PedidosList
        pedidos={pedidos.map((pedido) => ({
          ...pedido,
          createdAt: pedido.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
