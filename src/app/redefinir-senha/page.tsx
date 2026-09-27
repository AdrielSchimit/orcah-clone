import Link from "next/link";
import { BrandBar } from "@/components/brand-bar";
import { PasswordResetConfirmForm } from "@/components/password-reset-confirm-form";
import { getResetTokenStatus } from "@/lib/password-reset";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  const status = await getResetTokenStatus(token);

  return (
    <div className="flex flex-1 flex-col bg-brand-wash text-text">
      <BrandBar />
      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-8">
        {status === "valid" ? (
          <PasswordResetConfirmForm token={token} />
        ) : (
          <div className="rounded-box border border-line bg-card p-5 shadow-card">
            <h1 className="text-2xl font-semibold">Este link já foi utilizado ou expirou.</h1>
            <p className="mt-3 text-sm leading-6 text-text-soft">
              Peça um novo link para redefinir sua senha do Orçah.
            </p>
            <Link
              href="/recuperar-senha"
              className="mt-5 flex min-h-12 items-center justify-center rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press"
            >
              Pedir novo link
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
