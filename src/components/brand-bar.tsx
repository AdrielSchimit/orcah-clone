import Link from "next/link";
import { OrcahLogo } from "@/components/orcah-logo";
import { appUrl } from "@/lib/urls";

export function BrandBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-card px-4 py-3">
      <div className="mx-auto flex w-full max-w-5xl items-center">
        <Link href={appUrl("/")} aria-label="Orçah" className="flex min-h-12 shrink-0 items-center">
          <OrcahLogo priority />
        </Link>
      </div>
    </header>
  );
}
