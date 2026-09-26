import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { isPreviewAdmin } from "@/lib/admin";
import { ramoLabel, serviceAreaLabel } from "@/lib/company-display";
import { ensureSubscription, planView } from "@/lib/plan";
import { getSessionUser } from "@/lib/session";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-box border border-line bg-card p-4">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">{title}</h2>
      {children}
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 text-sm">
      <span className="text-text-soft">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}

export default async function ContaPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const admin = isPreviewAdmin(user);
  const plan = planView(await ensureSubscription(user.company.id), { isAdmin: admin });

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Conta</h1>
      <div className="flex flex-col gap-3">
        <Card title="Perfil">
          <Line label="Nome" value={user.name} />
          <Line label="E-mail de acesso" value={user.email} />
        </Card>

        <Card title="Empresa">
          <Line label="Nome" value={user.company.name} />
          <Line label="Ramo" value={ramoLabel(user.company)} />
          <p className="mt-1 text-sm text-text-soft">{serviceAreaLabel(user.company)}</p>
          <Link href="/painel/pagina#perfil" className="mt-3 flex min-h-12 items-center justify-center rounded-btn border border-line text-sm font-medium">
            Editar dados da página
          </Link>
        </Card>

        <Card title="Plano">
          <Line label="Situação" value={plan.label} />
          <p className="mt-1 text-sm text-text-soft">{plan.detail}</p>
          {admin ? null : (
            <Link href="/painel/plano" className="mt-3 flex min-h-12 items-center justify-center rounded-btn border border-line text-sm font-medium">
              Ver plano
            </Link>
          )}
        </Card>

        <Card title="Segurança">
          <p className="text-sm text-text-soft">Para trocar a senha, peça um link de redefinição.</p>
          <Link href="/recuperar-senha" className="mt-3 flex min-h-12 items-center justify-center rounded-btn border border-line text-sm font-medium">
            Trocar senha
          </Link>
        </Card>

        <div className="flex justify-center pt-2">
          <LogoutButton className="min-h-12 px-6 text-sm font-medium text-no" />
        </div>
      </div>
    </>
  );
}
