import { CompanyGalleryForm } from "@/components/company-gallery-form";
import { CompanyProfileForm } from "@/components/company-profile-form";
import { CopyLinkButton } from "@/components/copy-link-button";
import { ramoLabel, serviceAreaLabel } from "@/lib/company-display";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { companyPublicUrl } from "@/lib/urls";

export default async function EmpresaPainelPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;

  const photos = await prisma.companyPhoto.findMany({
    where: { companyId: user.company.id, active: true },
    orderBy: { sortOrder: "asc" },
  });

  const url = companyPublicUrl(user.company.slug);

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Sua página</h1>

      <section className="mb-5 overflow-hidden rounded-box border border-line bg-brand-wash p-4 text-text">
        <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Prévia</p>
        <div className="mt-3 flex items-center gap-3">
          {user.company.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.company.logoPath} alt="" className="h-14 w-14 rounded-btn object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-gold-wash text-lg font-semibold">
              {user.company.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.company.name}</p>
            <p className="truncate text-sm text-text-soft">{ramoLabel(user.company)}</p>
            <p className="truncate text-xs text-text-soft">{serviceAreaLabel(user.company)}</p>
          </div>
        </div>
        {photos.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {photos.slice(0, 2).map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.id} src={photo.path} alt="" className="h-20 w-full rounded-xl object-cover" />
            ))}
          </div>
        ) : null}
        <p className="mt-3 rounded-btn bg-gold py-3 text-center text-sm font-semibold text-ink">Pedir orçamento</p>
      </section>

      <div className="mb-3 rounded-box bg-gold-wash px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Link da bio</p>
        <p className="mt-1 break-all text-sm font-semibold">{url}</p>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-2">
        <CopyLinkButton url={url} label="Copiar link da bio" variant="primary" />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-12 items-center justify-center rounded-btn border border-line bg-card px-3 text-center text-sm font-medium"
        >
          Ver página
        </a>
      </div>
      <CompanyProfileForm company={user.company} />
      <CompanyGalleryForm photos={photos} />
    </>
  );
}
