import Link from "next/link";
import { BrandBar } from "@/components/brand-bar";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col bg-brand-wash text-text">
      <BrandBar />
      <main className="mx-auto flex w-full max-w-md flex-col px-4 pb-10 pt-8">
        <h1 className="mb-1 text-2xl font-semibold">Entrar</h1>
        <p className="mb-6 text-sm text-text-soft">Abra o painel da sua empresa.</p>
        <div className="rounded-box border border-line bg-card p-4">
          <AuthForm mode="login" />
        </div>
        <p className="mt-4 text-center text-sm">
          <Link href="/recuperar-senha" className="text-text-soft">
            Esqueci a senha
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-text-soft">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-gold-deep">
            Criar agora
          </Link>
        </p>
      </main>
    </div>
  );
}
