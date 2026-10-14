import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPublicCompanyPage } from "@/lib/public-page";
import { ProviderShowcase } from "@/components/provider-showcase";
import homeButtons from "@/components/home/home-buttons.module.css";

const loadPage = cache((slug: string) => getPublicCompanyPage(prisma, slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await loadPage((await params).slug);
  if (!page) return { title: { absolute: "Página não encontrada | Orçah" } };
  const title = `${page.name} | Orçah`;
  const description =
    page.description?.slice(0, 160) || `${page.ramo} em ${page.areaLabel}. Peça seu orçamento pelo celular.`;
  return {
    // absoluto: o layout raiz acrescentaria "· Orçah" de novo
    title: { absolute: title },
    description,
    openGraph: { title, description, type: "website", locale: "pt_BR" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EmpresaPublicaPage({params, searchParams}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ servico?: string }>;
}) {
  const page = await loadPage((await params).slug);
  if (!page) notFound();
  const chosenService = String((await searchParams).servico ?? "").slice(0, 160);
  return <ProviderShowcase page={page} chosenService={chosenService} buttonStyles={{gold:homeButtons.gold,secondary:homeButtons.secondary}} />;
}
