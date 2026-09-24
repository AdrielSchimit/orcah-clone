"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrcahLogo } from "@/components/orcah-logo";

const items = [
  { href: "/painel", label: "Início", id: "home" },
  { href: "/painel/pedidos", label: "Pedidos", id: "pedidos" },
  { href: "/painel/clientes", label: "Clientes", id: "clientes" },
  { href: "/painel/empresa", label: "Página", id: "pagina" },
  { href: "/painel/mais", label: "Mais", id: "mais" },
] as const;

function isActive(pathname: string, id: (typeof items)[number]["id"]) {
  if (id === "home") return pathname === "/painel" || pathname.startsWith("/painel/orcamentos");
  if (id === "pedidos") return pathname.startsWith("/painel/pedidos");
  if (id === "clientes") return pathname.startsWith("/painel/clientes");
  if (id === "pagina") return pathname.startsWith("/painel/empresa");
  return pathname.startsWith("/painel/mais") || pathname.startsWith("/painel/plano");
}

function Icon({ id, active }: { id: (typeof items)[number]["id"]; active: boolean }) {
  const stroke = active ? "currentColor" : "currentColor";
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path {...common} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (id === "pedidos") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path {...common} d="M7 7h10M7 12h10M7 17h6" />
        <rect {...common} x="4" y="3" width="16" height="18" rx="2" />
      </svg>
    );
  }
  if (id === "clientes") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <circle {...common} cx="9" cy="8" r="3" />
        <path {...common} d="M4 19c.5-3 2.5-5 5-5s4.5 2 5 5" />
        <circle {...common} cx="17" cy="9" r="2.2" />
        <path {...common} d="M16.5 14.2c2 .4 3.5 2 3.8 4.3" />
      </svg>
    );
  }
  if (id === "pagina") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect {...common} x="5" y="3" width="14" height="18" rx="2" />
        <path {...common} d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function PainelNav({ pedidosNovos }: { pedidosNovos: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] text-text-soft shadow-[0_-12px_32px_rgba(21,31,56,0.08)] md:inset-y-0 md:right-auto md:h-full md:w-56 md:border-r md:border-t-0 md:pb-4 md:shadow-none">
      <div className="hidden items-center px-5 pb-6 pt-6 md:flex">
        <Link href="/painel" aria-label="Orçah" className="flex items-center">
          <OrcahLogo className="h-8 w-auto" />
        </Link>
      </div>
      <ul className="flex items-stretch justify-around px-1 pt-1 md:flex-col md:gap-1 md:px-3">
        {items.map((item) => {
          const active = isActive(pathname, item.id);
          return (
            <li key={item.href} className="flex-1 md:flex-none">
              <Link
                href={item.href}
                className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-btn px-2 py-2 text-[11px] font-medium md:min-h-12 md:flex-row md:justify-start md:gap-3 md:px-3 md:text-sm ${
                  active ? "bg-gold-wash text-text" : "text-text-soft"
                }`}
              >
                {active ? (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gold md:hidden" />
                ) : null}
                <span className="relative">
                  <Icon id={item.id} active={active} />
                  {item.id === "pedidos" && pedidosNovos > 0 ? (
                    <span className="absolute -right-2.5 -top-1 min-w-4 rounded-full bg-gold px-1 text-center text-[10px] font-bold leading-4 text-ink">
                      {pedidosNovos > 9 ? "9+" : pedidosNovos}
                    </span>
                  ) : null}
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
