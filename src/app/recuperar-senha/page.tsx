import Link from "next/link";
import { BrandBar } from "@/components/brand-bar";
import { PasswordResetRequestForm } from "@/components/password-reset-request-form";

export default function RecuperarSenhaPage() {
  return (
    <div className="flex flex-1 flex-col bg-brand-wash text-text">
      <BrandBar />
      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-8">
        <h1 className="mb-1 text-2xl font-semibold">Esqueceu sua senha?</h1>
        <p className="mb-6 text-sm text-text-soft">
          Digite seu e-mail e enviaremos um link para criar uma nova senha.
        </p>
        <div className="rounded-box border border-line bg-card p-4">
          <PasswordResetRequestForm />
        </div>
        <Link href="/login" className="mt-6 inline-block font-medium text-gold-deep">
          Voltar ao login
        </Link>
      </main>
    </div>
  );
}
