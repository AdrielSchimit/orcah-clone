import Image from "next/image";

type Variant = "light" | "dark";
type Layout = "horizontal" | "stacked";

export function OrcahLogo({
  variant = "light",
  layout,
  className = "h-9 w-auto md:h-10",
  priority = false,
}: {
  variant?: Variant;
  layout?: Layout;
  className?: string;
  priority?: boolean;
}) {
  const src = variant === "dark" ? "/brand/orcah-logo-branco.svg" : "/brand/orcah-logo.svg";

  return (
    <Image
      src={src}
      alt="Orçah"
      width={872}
      height={242}
      className={className}
      priority={priority || layout === "stacked"}
    />
  );
}

export function OrcahIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Image
      src="/brand/orcah-icon.svg"
      alt="Orçah"
      width={256}
      height={256}
      className={className}
    />
  );
}
