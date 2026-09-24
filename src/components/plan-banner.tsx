import Link from "next/link";

export function PlanBanner({
  kind,
  label,
  detail,
}: {
  kind: "trial" | "active" | "expired" | "admin";
  label: string;
  detail: string;
}) {
  const tone =
    kind === "expired"
      ? "border-no/30 bg-no-wash"
      : kind === "trial"
        ? "border-gold/40 bg-gold-wash"
        : "border-line bg-card";

  return (
    <Link href="/painel/plano" className={`mb-4 block rounded-box border px-4 py-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        {kind === "trial" ? (
          <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-ink">Trial</span>
        ) : null}
        {kind === "expired" ? (
          <span className="rounded-full bg-no px-2.5 py-0.5 text-[11px] font-bold text-white">Venceu</span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-text-soft">{detail}</p>
    </Link>
  );
}
