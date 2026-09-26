import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Assistente } from "@/components/assistente";
import { OrcahLogo } from "@/components/orcah-logo";
import { PainelNav } from "@/components/painel-nav";
import { PlanBanner } from "@/components/plan-banner";
import { isPreviewAdmin } from "@/lib/admin";
import { ramoLabel, serviceAreaLabel } from "@/lib/company-display";
import { prisma } from "@/lib/db";
import { ensureSubscription, planView } from "@/lib/plan";
import { getSessionUser } from "@/lib/session";
import { appUrl, companyPublicUrl, sessionCookieIsShared, tenantSlugFromHost } from "@/lib/urls";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect(appUrl("/login"));
  if (!user.company) redirect(appUrl("/onboarding"));

  const admin = isPreviewAdmin(user);
  const host = (await headers()).get("host") ?? "";
  const tenant = tenantSlugFromHost(host);
  if (tenant && tenant !== user.company.slug) {
    redirect(
      sessionCookieIsShared()
        ? `${companyPublicUrl(user.company.slug)}/painel`
        : appUrl("/painel"),
    );
  }
  const plan = planView(await ensureSubscription(user.company.id), { isAdmin: admin });
  const path = (await headers()).get("x-orcah-path") ?? "";
  if (!admin && !plan.ok && !path.startsWith("/painel/plano")) {
    redirect("/painel/plano");
  }

  const [pedidosNovos, orcamentos, clientes, servicos, fotos] = await Promise.all([
    prisma.quoteRequest.count({ where: { companyId: user.company.id, status: "new" } }),
    prisma.budget.count({ where: { companyId: user.company.id } }),
    prisma.customer.count({ where: { companyId: user.company.id } }),
    prisma.service.count({ where: { companyId: user.company.id, active: true } }),
    prisma.companyPhoto.count({ where: { companyId: user.company.id, active: true } }),
  ]);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="min-h-full w-full bg-paper md:pl-56">
      <header className="w-full border-b border-line bg-card px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-text">
        <div className="mx-auto flex max-w-lg items-center gap-3 md:max-w-4xl">
          {user.company.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.company.logoPath}
              alt=""
              className="h-11 w-11 rounded-btn object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-gold-wash text-sm font-semibold text-text">
              {user.company.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-soft">Olá, {firstName}</p>
            <p className="truncate font-semibold">{user.company.name}</p>
            <p className="truncate text-xs text-text-soft">
              {ramoLabel(user.company)} · {serviceAreaLabel(user.company)}
            </p>
          </div>
          <Link href={appUrl("/")} aria-label="Orçah" className="flex shrink-0 items-center md:hidden">
            <OrcahLogo className="h-7 w-auto" />
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-36 pt-5 md:max-w-4xl md:pb-10">
        {plan.kind === "admin" ? null : (
          <PlanBanner kind={plan.kind} label={plan.label} detail={plan.detail} />
        )}
        {children}
      </div>
      <PainelNav pedidosNovos={pedidosNovos} />
      <Assistente
        contexto={{
          orcamentos,
          clientes,
          pedidosNovos,
          temLogo: Boolean(user.company.logoPath),
          temDescricao: Boolean(user.company.description?.trim()),
          servicos,
          fotos,
        }}
      />
    </div>
  );
}
