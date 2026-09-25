import Image from "next/image";

export function OrcahMark({
  className = "h-9 w-auto md:h-10",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/orcah-logo.svg"
      alt="Orçah"
      width={872}
      height={242}
      className={className}
      priority={priority}
    />
  );
}
