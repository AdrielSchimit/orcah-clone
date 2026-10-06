import Link from "next/link";
import styles from "./page.module.css";
import homeButtons from "@/components/home/home-buttons.module.css";
import { OpenDetailsOnHash } from "@/components/open-details-on-hash";
import {
  AppearanceForm,
  AssistedSetupCard,
  ContactForm,
  GalleryManager,
  ProfileForm,
  ShareBar,
} from "@/components/page-editor";
import { ASSISTED_SETUP_PRICE_LABEL, ASSISTED_SETUP_STATUS_LABEL, findActiveAssistedSetup } from "@/lib/assisted-setup";
import { SharePreviewCard } from "@/components/share-preview-card";
import { ramoLabel } from "@/lib/company-display";
import { companySharePreview } from "@/lib/share-preview";
import { pageCompleteness } from "@/lib/company-page";
import { prisma } from "@/lib/db";
import { publicServiceOrder } from "@/lib/services";
import { getSessionUser } from "@/lib/session";
import { companyPublicUrl } from "@/lib/urls";

const GALLERY_LIMIT = 12;

function Section({
  id,
  title,
  summary,
  done,
  children,
}: {
  id: string;
  title: string;
  summary: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details id={id} className={`${styles.accordion} group`}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            done ? "bg-ok-wash text-ok" : "bg-gold-wash text-gold-deep"
          }`}
        >
          {done ? "✓" : "•"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="block truncate text-xs text-text-soft">{summary}</span>
        </span>
        <span aria-hidden className="text-text-soft transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="border-t border-line px-4 pb-4 pt-4">{children}</div>
    </details>
  );
}

export default async function PaginaPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const company = user.company;

  const [photos, services, servicesCount, states, setup] = await Promise.all([
    prisma.companyPhoto.findMany({
      where: { companyId: company.id, active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, path: true, title: true },
    }),
    prisma.service.findMany({
      where: { companyId: company.id, active: true },
      orderBy: publicServiceOrder,
      select: { id: true, name: true, featured: true },
      take: 4,
    }),
    prisma.service.count({ where: { companyId: company.id, active: true } }),
    prisma.state.findMany({ orderBy: { uf: "asc" }, select: { id: true, name: true, uf: true } }),
    findActiveAssistedSetup(prisma, company.id),
  ]);

  const url = companyPublicUrl(company.slug);
  const place = company.city ? `${company.city.name} - ${company.state.uf}` : company.state.name;
  const sharePreview = companySharePreview({
    name: company.name,
    ramo: ramoLabel(company),
    place: company.servesRegion ? `${place} e região` : place,
    description: company.description,
    host: url,
  });
  const progress = pageCompleteness({
    logoPath: company.logoPath,
    description: company.description,
    whatsapp: company.whatsapp,
    openingHours: company.openingHours,
    instagram: company.instagram,
    website: company.website,
    facebook: company.facebook,
    servicesCount,
    photosCount: photos.length,
  });
  const done = (key: string) => progress.items.find((item) => item.key === key)?.done ?? false;

  return (
    <div className={styles.editor}>
      <OpenDetailsOnHash />
      <h1 className="sr-only">Editar página</h1>
      <header className={styles.heading}>
        <div className={styles.headingRow}>
        <span className={styles.headingIcon} aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H5v20h14V7Z" /><path d="M14 2v6h5M8 12h8M8 16h8" /></svg></span>
        <div className={styles.headingText}>
          <h2 className={styles.cardTitle}>Sua Página</h2>
        </div>
          <span className={styles.liveBadge}>No ar</span>
        </div>
        <div className={styles.shareActions}>
        <ShareBar url={url} name={company.name} />
        </div>
        <details className={styles.shareDetails}>
          <summary>Prévia do link e dica para o Instagram</summary>
          <div className={styles.shareContent}>
            <SharePreviewCard preview={sharePreview} />
            <p className="text-xs text-text-soft break-words">
              Para acompanhar os acessos pela bio do Instagram, use <strong>{url}?utm_source=instagram</strong>.
            </p>
          </div>
        </details>
      </header>

      <section className={styles.progress}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Página completa</p>
          <span className="text-sm font-semibold text-gold-deep">{progress.percent}%</span>
        </div>
        <div role="progressbar" aria-label="Página completa" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-paper-alt">
          <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(4, progress.percent)}%` }} />
        </div>
        {progress.missing.length > 0 ? (
          <details className={styles.suggestions}>
            <summary>{progress.missing.length} sugestões para completar</summary>
            <ul className="mt-2 grid gap-1">
            {progress.missing.map((item) => (
              <li key={item.key}>
                <a href={item.href} className="flex min-h-10 items-center justify-between rounded-btn px-2 text-sm hover:bg-paper">
                  <span>{item.label}</span>
                  <span aria-hidden className="text-text-soft">
                    ›
                  </span>
                </a>
              </li>
            ))}
            </ul>
          </details>
        ) : null}
      </section>

      <div className={styles.sectionHeading}><h2>Editar página</h2></div>
      <div className={styles.sections}>
        <Section id="perfil" title="Perfil" summary="Nome, o que você faz, cidade e horário" done={done("descricao") && done("horario")}>
          <ProfileForm
            company={{
              name: company.name,
              description: company.description,
              openingHours: company.openingHours,
              servesRegion: company.servesRegion,
              stateId: company.stateId,
              cityName: company.city?.name ?? "",
              ramo: ramoLabel(company),
            }}
            states={states}
          />
        </Section>

        <Section
          id="servicos"
          title="Serviços"
          summary={
            servicesCount === 0
              ? "Nenhum serviço ainda"
              : `${servicesCount} ${servicesCount === 1 ? "serviço" : "serviços"} na página`
          }
          done={done("servicos")}
        >
          {services.length > 0 ? (
            <ul className="mb-3 grid gap-1 text-sm">
              {services.map((service) => (
                <li key={service.id} className="flex items-center gap-2">
                  <span aria-hidden className="text-gold-deep">
                    {service.featured ? "★" : "•"}
                  </span>
                  {service.name}
                </li>
              ))}
              {servicesCount > services.length ? (
                <li className="text-text-soft">e mais {servicesCount - services.length}…</li>
              ) : null}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-text-soft">
              Mostre o que você faz. Cadastre seus serviços para eles aparecerem aqui.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/painel/servicos/novo"
              className={`${homeButtons.gold} flex min-h-12 items-center justify-center rounded-[14px] px-3 text-sm font-semibold text-ink`}
            >
              + Cadastrar serviço
            </Link>
            <Link
              href="/painel/servicos"
              className="flex min-h-12 items-center justify-center rounded-btn border border-line px-3 text-sm font-medium"
            >
              Gerenciar
            </Link>
          </div>
        </Section>

        <Section
          id="fotos"
          title="Fotos"
          summary={photos.length === 0 ? "Mostre seus trabalhos" : `${photos.length} de ${GALLERY_LIMIT} fotos`}
          done={done("fotos")}
        >
          {photos.length === 0 ? (
            <p className="mb-3 text-sm text-text-soft">Mostre seus trabalhos. Fotos deixam sua página mais profissional.</p>
          ) : null}
          <GalleryManager photos={photos} limit={GALLERY_LIMIT} />
        </Section>

        <Section id="contato" title="Contato" summary="WhatsApp, Instagram, Facebook e site" done={done("whatsapp") && done("redes")}>
          <ContactForm
            company={{
              whatsapp: company.whatsapp,
              phone: company.phone,
              instagram: company.instagram,
              instagramConfirmed: company.instagramConfirmed,
              facebook: company.facebook,
              website: company.website,
            }}
          />
        </Section>

        <Section id="aparencia" title="Aparência" summary="Logo e cores" done={done("logo")}>
          <AppearanceForm
            company={{
              name: company.name,
              logoPath: company.logoPath,
              primaryColor: company.primaryColor,
              secondaryColor: company.secondaryColor,
            }}
          />
        </Section>
      </div>

      <details className={styles.assisted} open={Boolean(setup)}>
        <summary>{setup ? "Configuração assistida em andamento" : "Precisa de ajuda para montar sua página?"}</summary>
        <AssistedSetupCard
          priceLabel={ASSISTED_SETUP_PRICE_LABEL}
          active={setup ? { status: setup.status, statusLabel: ASSISTED_SETUP_STATUS_LABEL[setup.status] } : null}
        />
      </details>
    </div>
  );
}
