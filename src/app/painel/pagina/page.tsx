/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ServiceCreateModal } from "@/components/service-create-modal";
import { ServiceList } from "@/components/service-list";
import { companyTemplate } from "@/lib/templates";
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
  BusinessInformationForm,
  GalleryManager,
  ShareBar,
} from "@/components/page-editor";
import { ASSISTED_SETUP_PRICE_LABEL, ASSISTED_SETUP_STATUS_LABEL, findActiveAssistedSetup } from "@/lib/assisted-setup";

import { ramoLabel } from "@/lib/company-display";

import { pageCompleteness } from "@/lib/company-page";
import { prisma } from "@/lib/db";
import { publicServiceOrder, serializeService } from "@/lib/services";
import { getSessionUser } from "@/lib/session";
import { companyPublicUrl } from "@/lib/urls";

import { readMunicipios, resolveSavedMunicipio } from "@/lib/municipios-server";

const GALLERY_LIMIT = 12;

export default async function PaginaPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const company = user.company;
  const serviceTemplate = companyTemplate(company);
  const serviceDefaults = {nameExample:serviceTemplate.suggestions[0]?.name ?? "Nome do serviço que você oferece",units:serviceTemplate.units,defaultUnit:serviceTemplate.defaultUnit,suggestions:serviceTemplate.suggestions.map(item=>item.name)};

  const [photos, services, servicesCount, setup] = await Promise.all([
    prisma.companyPhoto.findMany({
      where: { companyId: company.id, active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, path: true, title: true, sortOrder: true },
    }),
    prisma.service.findMany({
      where: { companyId: company.id },
      orderBy: [{active:"desc"},...publicServiceOrder],
      take: 60,
    }),
    prisma.service.count({ where: { companyId: company.id, active: true } }),
    findActiveAssistedSetup(prisma, company.id),
  ]);

  const serviceCities = await prisma.city.findMany({where:{id:{in:company.serviceCityIds}},select:{id:true,name:true,state:{select:{uf:true}}}});
  const selectedCities = serviceCities.map(city=>({id:city.id,name:city.name,uf:city.state.uf}));
  const url = companyPublicUrl(company.slug);
  const place = company.city ? `${company.city.name} - ${company.state.uf}` : company.state.name;
  const progress = pageCompleteness({
    coverPath: company.coverPath,
    cityId: company.cityId,
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
  const municipio = resolveSavedMunicipio(await readMunicipios(), company.city, company.state.uf);
  const profileInfo = {municipio,name:company.name,description:company.description,openingHours:company.openingHours,servesRegion:company.servesRegion,serviceRadiusKm:company.serviceRadiusKm,serviceCities:selectedCities,stateId:company.stateId,cityName:company.city?.name ?? "",whatsapp:company.whatsapp,phone:company.phone,instagram:company.instagram,instagramConfirmed:company.instagramConfirmed,facebook:company.facebook,website:company.website};
  return (
    <div className={styles.editor}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarIdentity}><div className={styles.toolbarTitle}><h1>Sua página</h1><span className={styles.live}>● Publicada</span></div><a href={url} target="_blank" rel="noreferrer" className={styles.pageUrl}>{url.replace(/^https?:\/\//,"").replace(/\/$/,"")}</a></div>
        <ShareBar url={url} name={company.name} />
      </header>
      <section className={styles.identity} data-cover={Boolean(cover)} style={{ backgroundColor: cover ? primary : defaultCoverTheme.background, color: cover ? "#ffffff" : readableTextColor(defaultCoverTheme.background) }} aria-label="Identidade da sua página">
        <div className={styles.cover}>
          {cover ? <img src={cover} alt="Capa da sua página" /> : <ServiceCoverPlaceholder category={coverCategory} className={styles.coverWash} />}
          <EditorModal id="capa" title="Fundo da sua página" label={cover ? "✎ Alterar capa" : "+ Adicionar capa"} className={styles.coverEdit}>
            <CoverPicker photos={photos} services={services.filter(service=>service.active).map(service=>({id:service.id,name:service.name,imagePath:service.imagePath}))} history={rememberCover(company.coverHistory,cover).slice(0,8)} currentCover={cover} color={primary} hasCover={Boolean(cover)} category={ramoLabel(company)} />
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
            <p className={styles.location}>⌖ {place}</p>
            {company.openingHours ? <p className={styles.location}>{company.openingHours}</p> : null}
          </div>
          <p className={styles.reviews}>Ainda sem avaliações</p>
        </div>
        <EditorModal id="perfil" title="Editar informações" label="✎ Editar informações" className={styles.profileEdit}>
          <BusinessInformationForm company={profileInfo} />
        </EditorModal>
      </section>
      <section className={styles.progress} aria-label="Progresso da página">
        <div><p>Sua página está <strong>{progress.percent}% completa</strong></p><span>{progress.percent}%</span></div>
        <div role="progressbar" aria-label="Página completa" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} className={styles.track}><div style={{width: `${progress.percent}%`}} /></div>
        {next ? <div className={styles.next}><p><span className={styles.stepLabel}>Próximo passo</span>{next.label}</p><a href={next.key==="servicos" ? "#servicos" : next.href} className={`${homeButtons.secondary} ${styles.action}`}>{["servicos","fotos","logo","capa"].includes(next.key) ? "Adicionar" : "Editar"} →</a></div> : <p className={styles.complete}>Tudo pronto para compartilhar sua página.</p>}
      </section>
      <section id="servicos" className={styles.workspace}>
        <div className={styles.sectionHeader}><div><h2>Serviços</h2><p>Mostre aos clientes o que você faz</p></div>{services.length > 0 && <ServiceCreateModal serviceCount={services.length} label="+ Adicionar serviço" className={`${homeButtons.gold} ${styles.action}`} ramo={ramoLabel(company)} categories={[...new Set(services.flatMap(service=>service.category ? [service.category] : []))]} defaults={serviceDefaults} />}</div>
        {services.length ? <ServiceList key={JSON.stringify(services.map(serializeService))} services={services.map(serializeService)} editor={{ramo:ramoLabel(company),defaults:serviceDefaults}}/> : <div className={styles.empty}><strong>Você ainda não cadastrou serviços</strong><p>Adicione os serviços que oferece para aparecer nas buscas certas.</p><ServiceCreateModal serviceCount={services.length} label="+ Cadastrar primeiro serviço" className={`${homeButtons.gold} ${styles.action}`} ramo={ramoLabel(company)} categories={[]} defaults={serviceDefaults} /></div>}
        {servicesCount > 0 ? <Link className={styles.manage} href="/painel/servicos">Gerenciar todos os serviços →</Link> : null}
      </section>
      <section id="fotos" className={styles.workspace}>
        <div className={styles.sectionHeader}><div><h2>Fotos do trabalho</h2><p>Seus trabalhos, à vista dos clientes</p></div><span className={styles.count}>{photos.length}/{GALLERY_LIMIT}</span></div>
        <GalleryManager photos={photos} limit={GALLERY_LIMIT} />
      </section>
      <details className={styles.assisted} open={Boolean(setup)}><summary>{setup ? "Configuração assistida em andamento" : "Precisa de ajuda para montar sua página?"}</summary><AssistedSetupCard priceLabel={ASSISTED_SETUP_PRICE_LABEL} active={setup ? {status:setup.status,statusLabel:ASSISTED_SETUP_STATUS_LABEL[setup.status]} : null} /></details>
    </div>
  );
}
