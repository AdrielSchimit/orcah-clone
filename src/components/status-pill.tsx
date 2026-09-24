export function StatusPill({
  tone,
  children,
}: {
  tone: "wait" | "ok" | "no" | "muted";
  children: React.ReactNode;
}) {
  const className =
    tone === "ok"
      ? "bg-ok-wash text-ok"
      : tone === "no"
        ? "bg-no-wash text-no"
        : tone === "wait"
          ? "bg-wait-wash text-wait"
          : "bg-paper text-text-soft";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function budgetStatusTone(status: string): "wait" | "ok" | "no" | "muted" {
  if (status === "approved") return "ok";
  if (status === "rejected") return "no";
  if (status === "sent" || status === "viewed" || status === "waiting") return "wait";
  return "muted";
}

export function pedidoStatusTone(status: string): "wait" | "ok" | "no" | "muted" {
  if (status === "new") return "wait";
  if (status === "converted") return "ok";
  return "muted";
}
