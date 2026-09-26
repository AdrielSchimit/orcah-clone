import Link from "next/link";
import { MascoteAvatar } from "@/components/mascote";
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
import { ramoLabel } from "@/lib/company-display";
import { pageCompleteness } from "@/lib/company-page";
import { prisma } from "@/lib/db";
import { statsForPeriod, sumStats } from "@/lib/page-stats";
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
    <details id={id} className="group scroll-mt-4 rounded-box border border-line bg-card open:shadow-card">
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

  const [photos, services, servicesCount, states, setup, stats] = await Promise.all([
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
    statsForPeriod(prisma, company.id, 7),
  ]);

  const url = companyPublicUrl(company.slug);
  const views7 = sumStats(stats).views;
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

  const tip =
    servicesCount === 0
      ? "Cadastre seu primeiro serviço para ele aparecer na sua página."
      : photos.length === 0
        ? "Uma foto boa ajuda seu cliente a entender o que você faz."
        : progress.percent === 100
          ? "Sua página tá ficando profissional 😎"
          : "Uma página com fotos e serviços passa mais confiança 👀";

  return (
    <>
      <OpenDetailsOnHash />
      <h1 className="text-xl font-semibold">Sua página</h1>
      <p className="mb-4 text-sm text-text-soft">Preencha, salve e pronto: já fica bonito para o cliente.</p>

      <section className="gold-edge mb-4 rounded-box border bg-ink p-4 text-ink-text">
        <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold">Seu link</p>
        <p className="mt-1 break-all text-sm font-semibold">{url.replace(/^https?:\/\//, "")}</p>
        <p className="mt-1 text-xs text-ink-soft">
          {views7 === 1 ? "1 acesso" : `${views7} acessos`} nos últimos 7 dias ·{" "}
          <Link href="/painel/relatorios" className="underline underline-offset-2">
            ver relatório
          </Link>
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="gold-glow mt-3 flex min-h-12 items-center justify-center rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press"
        >
          Visualizar minha página
        </a>
      </section>
      <div className="mb-5">
        <ShareBar url={url} name={company.name} />
      </div>

      <section className="mb-5 rounded-box border border-line bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Sua página está {progress.percent}% completa</p>
          <span className="text-sm font-semibold text-gold-deep">{progress.percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-alt">
          <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(4, progress.percent)}%` }} />
        </div>
        <div className="mt-3 flex items-start gap-2">
          <MascoteAvatar className="h-9 w-9 shrink-0" />
          <p className="rounded-box rounded-tl-md bg-gold-wash px-3 py-2 text-sm">{tip}</p>
        </div>
        {progress.missing.length > 0 ? (
          <ul className="mt-3 grid gap-1">
            {progress.missing.slice(0, 3).map((item) => (
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
        ) : null}
        <p className="mt-2 text-xs text-text-soft">Sua página já está no ar. Completar só deixa ela mais forte.</p>
      </section>

      <div className="flex flex-col gap-3">
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
              className="flex min-h-12 items-center justify-center rounded-btn bg-ink px-3 text-sm font-semibold text-ink-text"
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

      <div className="mt-6">
        <AssistedSetupCard
          priceLabel={ASSISTED_SETUP_PRICE_LABEL}
          active={setup ? { status: setup.status, statusLabel: ASSISTED_SETUP_STATUS_LABEL[setup.status] } : null}
        />
      </div>
    </>
  );
}
