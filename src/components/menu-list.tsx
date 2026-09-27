import Link from "next/link";

export type MenuItem = {
  href: string;
  title: string;
  detail?: string;
  badge?: number;
  external?: boolean;
};

/** Lista de atalhos com linha inteira clicável (Mais, Conta). */
export function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-card">
      {items.map((item) => {
        const content = (
          <>
            <span className="min-w-0">
              <span className="block font-medium">{item.title}</span>
              {item.detail ? <span className="block truncate text-sm text-text-soft">{item.detail}</span> : null}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {item.badge && item.badge > 0 ? (
                <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-ink">
                  {`${item.badge > 9 ? "9+" : item.badge} ${item.badge === 1 ? "novo" : "novos"}`}
                </span>
              ) : null}
              <span aria-hidden className="text-text-soft">
                {item.external ? "↗" : "›"}
              </span>
            </span>
          </>
        );
        const className = "flex min-h-16 items-center justify-between gap-3 px-4 py-3";
        return (
          <li key={item.href + item.title}>
            {item.external ? (
              <a href={item.href} target="_blank" rel="noreferrer" className={className}>
                {content}
              </a>
            ) : (
              <Link href={item.href} className={className}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
