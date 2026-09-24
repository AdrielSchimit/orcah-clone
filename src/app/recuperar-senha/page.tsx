import Link from "next/link";
import { BrandBar } from "@/components/brand-bar";

export default function RecuperarSenhaPage() {
  return (
    <div className="flex flex-1 flex-col bg-brand-wash text-text">
      <BrandBar />
      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-8">
        <h1 className="mb-2 text-2xl font-semibold">Recuperar senha</h1>
        <div className="rounded-box border border-line bg-card p-4">
          <p className="text-sm leading-6 text-text-soft">
            O envio de e-mail ainda não está ligado. Por enquanto, crie a conta de novo só em
            desenvolvimento ou peça para resetar no banco.
          </p>
        </div>
        <Link href="/login" className="mt-6 inline-block font-medium text-gold-deep">
          Voltar ao login
        </Link>
      </main>
    </div>
  );
}
