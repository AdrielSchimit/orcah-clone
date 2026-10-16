"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrcahIcon, OrcahLogo } from "@/components/orcah-logo";
import { LiquidDock } from "@/components/liquid-dock";

type NavId = "home" | "clientes" | "orcamentos" | "pagina" | "mais" | "pedidos" | "servicos" | "relatorios";

// celular: 5 destinos. Pedidos, Serviços e Relatórios moram em "Mais" (e na lateral do desktop).
const primary: { href: string; label: string; id: NavId }[] = [
  { href: "/painel", label: "Início", id: "home" },
  { href: "/painel/clientes", label: "Clientes", id: "clientes" },
  { href: "/painel/orcamentos", label: "Orçamentos", id: "orcamentos" },
  { href: "/painel/pagina", label: "Página", id: "pagina" },
  { href: "/painel/mais", label: "Mais", id: "mais" },
];

const secondary: { href: string; label: string; id: NavId }[] = [
  { href: "/painel/pedidos", label: "Pedidos", id: "pedidos" },
  { href: "/painel/servicos", label: "Serviços", id: "servicos" },
  { href: "/painel/relatorios", label: "Relatórios", id: "relatorios" },
];

const moreRoutes = ["/painel/mais", "/painel/plano", "/painel/conta", "/painel/pedidos", "/painel/servicos", "/painel/relatorios"];

function isActive(pathname: string, id: NavId, desktop = false) {
  if (id === "home") return pathname === "/painel";
  if (id === "clientes") return pathname.startsWith("/painel/clientes");
  if (id === "orcamentos") return pathname.startsWith("/painel/orcamentos");
  if (id === "pagina") return pathname.startsWith("/painel/pagina") || pathname.startsWith("/painel/empresa");
  if (id === "pedidos") return pathname.startsWith("/painel/pedidos");
  if (id === "servicos") return pathname.startsWith("/painel/servicos");
  if (id === "relatorios") return pathname.startsWith("/painel/relatorios");
  // no desktop os itens de "Mais" têm entrada própria na lateral
  const routes = desktop ? ["/painel/mais", "/painel/plano", "/painel/conta"] : moreRoutes;
  return routes.some((route) => pathname.startsWith(route));
}

export function Icon({ id }: { id: NavId }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<NavId, React.ReactNode> = {
    home: <path {...common} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />,
    clientes: (
      <>
        <circle {...common} cx="9" cy="8" r="3" />
        <path {...common} d="M4 19c.5-3 2.5-5 5-5s4.5 2 5 5" />
        <circle {...common} cx="17" cy="9" r="2.2" />
        <path {...common} d="M16.5 14.2c2 .4 3.5 2 3.8 4.3" />
      </>
    ),
    orcamentos: (
      <>
        <path {...common} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path {...common} d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    ),
    pagina: (
      <>
        <rect {...common} x="3" y="4" width="18" height="16" rx="2" />
        <path {...common} d="M3 9h18M7 13h4M7 16h7" />
        <circle cx="6" cy="6.5" r=".9" fill="currentColor" />
      </>
    ),
    pedidos: (
      <>
        <path {...common} d="M4 13h4l1.5 3h5L16 13h4" />
        <path {...common} d="M5.5 6.5 4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5l-1.5-6.5A1 1 0 0 0 17.5 6h-11a1 1 0 0 0-1 .5z" />
      </>
    ),
    servicos: (
      <path {...common} d="M14.7 6.3a4 4 0 0 0-5.4 5.2l-5 5a1.7 1.7 0 0 0 2.4 2.4l5-5a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.6-.6-2.1z" />
    ),
    relatorios: <path {...common} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    mais: (
      <>
        <circle cx="6" cy="12" r="1.6" fill="currentColor" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <circle cx="18" cy="12" r="1.6" fill="currentColor" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      {paths[id]}
    </svg>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2.5 -top-1 min-w-4 rounded-full bg-gold px-1 text-center text-[10px] font-bold leading-4 text-ink">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// Nesta branch de preview, a navegação mobile usa um dock líquido compartilhado
// com a página pública de demonstração /preview/liquid-dock.

export function PainelNav({ pedidosNovos }: { pedidosNovos: number }) {
  const pathname = usePathname();
  const activeId = primary.find((item) => isActive(pathname, item.id))?.id ?? "home";
  const mobileItems = primary.map((item) => ({
    id: item.id,
    href: item.id === "orcamentos" ? "/painel/orcamentos/novo" : item.href,
    label: item.id === "orcamentos" ? "Orçamento" : item.label,
    icon: item.id === "orcamentos"
      ? <OrcahIcon className="h-6 w-6" />
      : <Icon id={item.id} />,
    badge: item.id === "mais" ? pedidosNovos : undefined,
  }));

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="pointer-events-auto mx-auto max-w-[420px]">
          <LiquidDock items={mobileItems} activeId={activeId} ariaLabel="Menu do painel" />
        </div>
      </div>

      <nav
        aria-label="Menu do painel"
        className="fixed inset-y-0 left-0 z-30 hidden h-full w-56 overflow-y-auto border-r border-line bg-card pb-4 text-text-soft md:block"
      >
        <div className="flex items-center px-5 pb-6 pt-6">
          <Link href="/painel" aria-label="Orçah" className="flex items-center">
            <OrcahLogo className="h-8 w-auto" />
          </Link>
        </div>
        <ul className="flex flex-col gap-1 px-3">
          {primary.map((item) => {
            const active = isActive(pathname, item.id, true);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-btn px-3 text-sm font-medium ${
                    active ? "bg-gold-wash text-text" : "text-text-soft"
                  }`}
                >
                  <Icon id={item.id} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 px-6 text-[11px] font-medium uppercase tracking-[0.06em] text-text-soft">Negócio</p>
        <ul className="flex flex-col gap-1 px-3 pt-2">
          {secondary.map((item) => {
            const active = isActive(pathname, item.id, true);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex min-h-12 items-center gap-3 rounded-btn px-3 text-sm font-medium ${
                    active ? "bg-gold-wash text-text" : "text-text-soft"
                  }`}
                >
                  <span className="relative">
                    <Icon id={item.id} />
                    {item.id === "pedidos" ? <Badge count={pedidosNovos} /> : null}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
