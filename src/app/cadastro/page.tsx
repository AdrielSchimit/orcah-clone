import Link from "next/link";
import { BrandBar } from "@/components/brand-bar";
import { AuthForm } from "@/components/auth-form";

export default function CadastroPage() {
  return (
    <div className="flex flex-1 flex-col bg-brand-wash text-text">
      <BrandBar />
      <main className="mx-auto flex w-full max-w-md flex-col px-4 pb-10 pt-8">
        <h1 className="mb-1 text-2xl font-semibold">Criar conta</h1>
        <p className="mb-6 text-sm text-text-soft">Um minuto. Depois você escolhe o ramo e o estado.</p>
        <div className="rounded-box border border-line bg-card p-4">
          <AuthForm mode="cadastro" />
        </div>
        <p className="mt-6 text-center text-sm text-text-soft">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-gold-deep">
            Entrar
          </Link>
        </p>
      </main>
    </div>
  );
}
