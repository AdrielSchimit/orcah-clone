import type { Metadata } from "next";
import { BrandBar } from "@/components/brand-bar";
import { VerifyEmail } from "@/components/verify-email";

export const metadata: Metadata = { title: "Confirme seu e-mail", robots: { index: false, follow: false } };

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; envio?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex flex-1 flex-col bg-brand-wash text-text">
      <BrandBar />
      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-8">
        <VerifyEmail token={String(params.token ?? "").slice(0, 200)} sendFailed={params.envio === "falhou"} />
      </main>
    </div>
  );
}
