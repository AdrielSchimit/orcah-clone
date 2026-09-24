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
      src="/brand/orcah-header2.png"
      alt="Orçah"
      width={875}
      height={264}
      className={className}
      priority={priority}
    />
  );
}
