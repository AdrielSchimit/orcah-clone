import { LogoutButton } from "@/components/logout-button";
import { MenuList, type MenuItem } from "@/components/menu-list";
import { isPreviewAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { PLAN_PRICE_LABEL } from "@/lib/plan-constants";
import { getSessionUser } from "@/lib/session";
import { companyPublicUrl } from "@/lib/urls";

export default async function MaisPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const admin = isPreviewAdmin(user);

  const [pedidosNovos, servicos] = await Promise.all([
    prisma.quoteRequest.count({ where: { companyId: user.company.id, status: "new" } }),
    prisma.service.count({ where: { companyId: user.company.id, active: true } }),
  ]);

  const negocio: MenuItem[] = [
    {
      href: "/painel/pedidos",
      title: "Pedidos",
      detail: pedidosNovos > 0 ? "Clientes esperando sua resposta" : "Quem pediu orçamento pela sua página",
      badge: pedidosNovos,
    },
    {
      href: "/painel/servicos",
      title: "Serviços",
      detail: servicos === 0 ? "Cadastre o que você faz" : `${servicos} ${servicos === 1 ? "serviço ativo" : "serviços ativos"}`,
    },
    { href: "/painel/relatorios", title: "Relatórios", detail: "Acessos, pedidos e aprovações" },
    { href: companyPublicUrl(user.company.slug), title: "Ver minha página", detail: "Como o cliente vê você", external: true },
  ];

  const conta: MenuItem[] = [
    { href: "/painel/conta", title: "Conta", detail: "Perfil, empresa e segurança" },
    ...(admin ? [] : [{ href: "/painel/plano", title: "Plano", detail: PLAN_PRICE_LABEL }]),
  ];

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Mais</h1>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Seu negócio</h2>
      <MenuList items={negocio} />
      <h2 className="mb-2 mt-6 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Conta</h2>
      <MenuList items={conta} />
      <div className="mt-6 flex justify-center">
        <LogoutButton className="min-h-12 px-6 text-sm font-medium text-no" />
      </div>
    </>
  );
}
