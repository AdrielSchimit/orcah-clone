import { Suspense } from "react";
import { BrandBar } from "@/components/brand-bar";
import { PrestadoresSearchPage } from "@/components/prestadores/prestadores-search-page";

export const metadata = {
  title: "Pesquisar prestadores",
  description: "Encontre prestadores de serviço que atendem sua região e peça orçamento pelo Orçah.",
};

export default function PrestadoresPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper text-text">
      <BrandBar />
      <Suspense fallback={<main className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-text-soft">Carregando busca…</main>}>
        <PrestadoresSearchPage />
      </Suspense>
    </div>
  );
}
