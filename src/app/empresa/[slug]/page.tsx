import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { OrcahLogo } from "@/components/orcah-logo";
import { instagramUrl, ramoLabel, serviceAreaLabel, websiteUrl } from "@/lib/company-display";
import { prisma } from "@/lib/db";
import { whatsappHref } from "@/lib/whatsapp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const company = await prisma.company.findUnique({
    where: { slug: (await params).slug },
    select: { name: true, description: true },
  });
  if (!company) return { title: "Empresa" };
  return {
    title: company.name,
    description: company.description ?? `Peça orçamento para ${company.name}`,
  };
}

export default async function EmpresaPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      city: { select: { name: true } },
      state: { select: { name: true, uf: true } },
      businessCategory: { select: { name: true } },
      photos: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!company) notFound();

  const zap = whatsappHref(
    company.whatsapp || company.phone,
    `Olá, ${company.name}! Vi sua página e gostaria de um orçamento.`,
  );
  const insta = instagramUrl(company.instagram);
  const site = websiteUrl(company.website);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col bg-paper pb-12">
      <header className="bg-brand-wash px-4 pb-8 pt-10 text-center text-text">
        {company.logoPath ? (
          <Image
            src={company.logoPath}
            alt={company.name}
            width={96}
            height={96}
            className="mx-auto mb-3 h-20 w-20 rounded-btn object-cover"
          />
        ) : (
          <span className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-btn bg-gold-wash text-2xl font-semibold text-text">
            {company.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <h1 className="text-2xl font-semibold">{company.name}</h1>
        <p className="mt-1 text-text-soft">{ramoLabel(company)}</p>
        <p className="text-sm text-text-soft">{serviceAreaLabel(company)}</p>
        {company.description ? (
          <p className="mx-auto mt-3 max-w-md text-sm text-text-soft">{company.description}</p>
        ) : null}
        <a
          href="#pedir"
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press"
        >
          Pedir orçamento
        </a>
      </header>

      <div className="px-4">
        {company.photos.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Nossos trabalhos</h2>
            <div className="grid grid-cols-2 gap-2">
              {company.photos.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-box border border-line bg-card">
                  <Image
                    src={photo.path}
                    alt={photo.title || "Trabalho realizado"}
                    width={600}
                    height={600}
                    className="h-36 w-full object-cover"
                  />
                  {photo.title ? (
                    <figcaption className="px-2 py-2 text-xs text-text-soft">{photo.title}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-box border border-line bg-card p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Entre em contato</h2>
          <div className="grid grid-cols-2 gap-2">
            {zap ? (
              <a
                href={zap}
                className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-btn bg-zap px-4 font-semibold text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                  <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.87 9.87 0 0 0 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01z" />
                </svg>
                WhatsApp
              </a>
            ) : null}
            {insta ? (
              <a
                href={insta}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center rounded-btn border border-line px-4 text-center font-medium"
              >
                Instagram
              </a>
            ) : null}
            {site ? (
              <a
                href={site}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center rounded-btn border border-line px-4 text-center font-medium"
              >
                Site
              </a>
            ) : null}
            {company.phone ? (
              <a
                href={`tel:${company.phone}`}
                className="flex min-h-12 items-center justify-center rounded-btn border border-line px-4 text-center font-medium"
              >
                Ligar
              </a>
            ) : null}
          </div>
          {company.openingHours ? (
            <p className="mt-3 text-sm text-text-soft">Horário: {company.openingHours}</p>
          ) : null}
        </section>

        <div className="mt-6">
          <QuoteRequestForm slug={company.slug} />
        </div>
        <p className="mt-8 flex flex-col items-center gap-2 text-center text-xs text-text-soft">
          <OrcahLogo className="h-6 w-auto" />
          Página feita com Orçah
        </p>
      </div>
    </div>
  );
}
