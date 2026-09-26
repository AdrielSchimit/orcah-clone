"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrcahLogo } from "@/components/orcah-logo";

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

function Icon({ id }: { id: NavId }) {
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

export function PainelNav({ pedidosNovos }: { pedidosNovos: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu do painel"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] text-text-soft shadow-[0_-12px_32px_rgba(21,31,56,0.08)] md:inset-y-0 md:right-auto md:h-full md:w-56 md:overflow-y-auto md:border-r md:border-t-0 md:pb-4 md:shadow-none"
    >
      <div className="hidden items-center px-5 pb-6 pt-6 md:flex">
        <Link href="/painel" aria-label="Orçah" className="flex items-center">
          <OrcahLogo className="h-8 w-auto" />
        </Link>
      </div>
      <ul className="flex items-stretch justify-around px-1 pt-1 md:flex-col md:gap-1 md:px-3">
        {primary.map((item) => {
          const mobileActive = isActive(pathname, item.id);
          const desktopActive = isActive(pathname, item.id, true);
          return (
            <li key={item.href} className="min-w-0 flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={mobileActive ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-btn px-1 py-2 text-[11px] font-medium md:min-h-12 md:flex-row md:justify-start md:gap-3 md:px-3 md:text-sm ${
                  mobileActive ? "bg-gold-wash text-text" : "text-text-soft"
                } ${desktopActive ? "md:bg-gold-wash md:text-text" : "md:bg-transparent md:text-text-soft"}`}
              >
                {mobileActive ? <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gold md:hidden" /> : null}
                <span className="relative">
                  <Icon id={item.id} />
                  {item.id === "mais" ? (
                    <span className="md:hidden">
                      <Badge count={pedidosNovos} />
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 hidden px-6 text-[11px] font-medium uppercase tracking-[0.06em] text-text-soft md:block">Negócio</p>
      <ul className="hidden flex-col gap-1 px-3 pt-2 md:flex">
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
  );
}
