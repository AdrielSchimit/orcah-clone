/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import styles from "./page.module.css";
import homeButtons from "@/components/home/home-buttons.module.css";
import { EditorModal, CoverPicker } from "@/components/visual-page-editor";
import { readableTextColor } from "@/lib/public-page";
import { rememberCover } from "@/lib/cover-history";
import { ServiceCoverPlaceholder } from "@/components/service-cover-placeholder";
import { resolveServiceCoverTheme } from "@/lib/service-cover-themes";
import {
  AppearanceForm,
  AssistedSetupCard,
  ContactForm,
  GalleryManager,
  ProfileForm,
  ShareBar,
} from "@/components/page-editor";
import { ASSISTED_SETUP_PRICE_LABEL, ASSISTED_SETUP_STATUS_LABEL, findActiveAssistedSetup } from "@/lib/assisted-setup";

import { ramoLabel } from "@/lib/company-display";

import { pageCompleteness } from "@/lib/company-page";
import { prisma } from "@/lib/db";
import { publicServiceOrder } from "@/lib/services";
import { getSessionUser } from "@/lib/session";
import { companyPublicUrl } from "@/lib/urls";

const GALLERY_LIMIT = 12;

export default async function PaginaPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const company = user.company;

  const [photos, services, servicesCount, states, setup] = await Promise.all([
    prisma.companyPhoto.findMany({
      where: { companyId: company.id, active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, path: true, title: true, sortOrder: true },
    }),
    prisma.service.findMany({
      where: { companyId: company.id, active: true },
      orderBy: publicServiceOrder,
      select: { id: true, name: true, featured: true, imagePath: true },
      take: 60,
    }),
    prisma.service.count({ where: { companyId: company.id, active: true } }),
    prisma.state.findMany({ orderBy: { uf: "asc" }, select: { id: true, name: true, uf: true } }),
    findActiveAssistedSetup(prisma, company.id),
  ]);

  const url = companyPublicUrl(company.slug);
  const place = company.city ? `${company.city.name} - ${company.state.uf}` : company.state.name;
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
  const primary = company.primaryColor ?? "#0b1120";

  const appearance = { name: company.name, logoPath: company.logoPath, primaryColor: company.primaryColor, secondaryColor: company.secondaryColor };
  const next = progress.missing[0];
  const cover = company.coverPath;
  const coverCategory = ramoLabel(company);
  const defaultCoverTheme = resolveServiceCoverTheme(coverCategory);
  return (
    <div className={styles.editor}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarTitle}><h1>Sua página</h1><span className={styles.live}>● No ar</span></div>
        <ShareBar url={url} name={company.name} />
      </header>
      <section className={styles.identity} data-cover={Boolean(cover)} style={{ backgroundColor: cover ? primary : defaultCoverTheme.background, color: cover ? "#ffffff" : readableTextColor(defaultCoverTheme.background) }} aria-label="Identidade da sua página">
        <div className={styles.cover}>
          {cover ? <img src={cover} alt="Capa da sua página" /> : <ServiceCoverPlaceholder category={coverCategory} className={styles.coverWash} />}
          <EditorModal id="capa" title="Fundo da sua página" label={cover ? "✎ Alterar capa" : "+ Adicionar capa"} className={styles.coverEdit}>
            <CoverPicker photos={photos} services={services} history={rememberCover(company.coverHistory,cover).slice(0,8)} currentCover={cover} color={primary} hasCover={Boolean(cover)} category={ramoLabel(company)} />
          </EditorModal>
        </div>
        <div className={styles.profile}>
          <EditorModal id="logo" title="Foto de perfil" label={<>{company.logoPath ? <img src={company.logoPath} alt="Trocar foto de perfil" /> : <span>{company.name.slice(0,1)}</span>}<span className={styles.avatarEdit}>✎</span></>} className={styles.avatar}>
            <AppearanceForm company={appearance} />
          </EditorModal>
          <div className={styles.profileText}>
            <p className={styles.category}>{ramoLabel(company)}</p>
            <h2>{company.name}</h2>
            <p className={styles.description}>{company.description || "Conte aos clientes o que você faz."}</p>
            <p className={styles.location}>⌖ {place}{company.servesRegion ? " e região" : ""}</p>
            {company.openingHours ? <p className={styles.location}>{company.openingHours}</p> : null}
            <EditorModal id="perfil" title="Editar perfil" label="✎ Editar perfil" className={styles.profileEdit}>
              <ProfileForm company={{name:company.name,description:company.description,openingHours:company.openingHours,servesRegion:company.servesRegion,stateId:company.stateId,cityName:company.city?.name ?? "",ramo:ramoLabel(company)}} states={states} />
            </EditorModal>
          </div>
          <p className={styles.reviews}>Ainda sem avaliações</p>
        </div>
      </section>
      <section className={styles.progress} aria-label="Progresso da página">
        <div><p>Sua página está <strong>{progress.percent}% completa</strong></p><span>{progress.percent}%</span></div>
        <div role="progressbar" aria-label="Página completa" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} className={styles.track}><div style={{width: `${progress.percent}%`}} /></div>
        {next ? <a href={next.href} className={styles.next}>+ {next.label} <span aria-hidden>→</span></a> : <p className={styles.complete}>Tudo pronto para compartilhar sua página.</p>}
      </section>
      <section id="servicos" className={styles.workspace}>
        <div className={styles.sectionHeader}><div><h2>Serviços</h2><p>Mostre o que você faz</p></div><Link href="/painel/servicos/novo" className={`${homeButtons.gold} ${styles.action}`}>+ Adicionar serviço</Link></div>
        {services.length ? <ul className={styles.serviceList}>{services.map(service => <li key={service.id}><Link href={`/painel/servicos/${service.id}`}>{service.featured ? "★ " : ""}{service.name}<span aria-hidden>✎</span></Link></li>)}</ul> : <Link href="/painel/servicos/novo" className={styles.empty}>+ Cadastre seu primeiro serviço</Link>}
        {servicesCount > 0 ? <Link className={styles.manage} href="/painel/servicos">Gerenciar todos os serviços →</Link> : null}
      </section>
      <section id="fotos" className={styles.workspace}>
        <div className={styles.sectionHeader}><div><h2>Fotos do trabalho</h2><p>Seus trabalhos, à vista dos clientes</p></div><span className={styles.count}>{photos.length}/{GALLERY_LIMIT}</span></div>
        <GalleryManager photos={photos} limit={GALLERY_LIMIT} />
      </section>
      <section className={styles.workspace}>
        <div className={styles.sectionHeader}><h2>Contato</h2><EditorModal id="contato" title="Configurar contato" label="Configurar" className={`${homeButtons.secondary} ${styles.action}`}><ContactForm company={{whatsapp:company.whatsapp,phone:company.phone,instagram:company.instagram,instagramConfirmed:company.instagramConfirmed,facebook:company.facebook,website:company.website}} /></EditorModal></div>
        <div className={styles.contactList}>{[["WhatsApp",Boolean(company.whatsapp)],["Instagram",Boolean(company.instagram && company.instagramConfirmed)],["Facebook",Boolean(company.facebook)],["Site",Boolean(company.website)]].map(([label,active]) => <span key={String(label)}>{label} <strong className={active ? styles.connected : styles.missing}>{active ? "✓" : "—"}</strong></span>)}</div>
      </section>
      <details className={styles.assisted} open={Boolean(setup)}><summary>{setup ? "Configuração assistida em andamento" : "Precisa de ajuda para montar sua página?"}</summary><AssistedSetupCard priceLabel={ASSISTED_SETUP_PRICE_LABEL} active={setup ? {status:setup.status,statusLabel:ASSISTED_SETUP_STATUS_LABEL[setup.status]} : null} /></details>
    </div>
  );
}
