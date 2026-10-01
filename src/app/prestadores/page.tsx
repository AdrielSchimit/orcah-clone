import Link from "next/link";
import { BrandBar } from "@/components/brand-bar";
import { OrcahLogo } from "@/components/orcah-logo";

export const metadata = {
  title: "Pesquisar prestadores",
  description: "Encontre prestadores de serviço na sua região com páginas profissionais no Orçah.",
};

export default function PrestadoresPage() {
  return (
    <div className="flex flex-1 flex-col bg-paper text-text">
      <BrandBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-8">
        <Link href="/" className="inline-flex min-h-12 items-center text-sm font-medium text-text-soft hover:text-text">
          ← Voltar ao site
        </Link>
        <div className="mt-4">
          <OrcahLogo />
        </div>
        <h1 className="mt-6 text-2xl font-semibold md:text-3xl">Pesquisar prestadores na sua região</h1>
        <p className="mt-3 max-w-xl text-text-soft">
          Em breve você poderá buscar pintores, eletricistas, marceneiros e outros profissionais perto de você — com
          fotos dos trabalhos, serviços e pedido de orçamento direto na página deles.
        </p>
        <div className="mt-8 rounded-box border border-line bg-card p-6 shadow-card">
          <label htmlFor="regiao" className="block text-sm font-medium">
            Sua cidade ou bairro
          </label>
          <input
            id="regiao"
            name="regiao"
            type="text"
            placeholder="Ex.: São Paulo, Centro"
            disabled
            className="mt-2 w-full rounded-btn border border-line bg-paper px-4 py-3 text-base text-text placeholder:text-text-soft/70 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <p className="mt-3 text-sm text-text-soft">Estamos preparando o diretório regional. Volte em breve.</p>
          <button
            type="button"
            disabled
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-btn bg-gold/50 px-5 text-base font-semibold text-ink/70 sm:w-auto"
          >
            Buscar prestadores
          </button>
        </div>
        <p className="mt-10 text-center text-sm text-text-soft">
          É prestador de serviço?{" "}
          <Link href="/cadastro" className="font-semibold text-gold-deep hover:underline">
            Crie sua página no Orçah
          </Link>
        </p>
      </main>
    </div>
  );
}
