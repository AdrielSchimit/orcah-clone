import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { isPreviewAdmin } from "@/lib/admin";
import { PLAN_PRICE_LABEL } from "@/lib/plan-constants";
import { getSessionUser } from "@/lib/session";
import { companyPublicUrl } from "@/lib/urls";

export default async function MaisPage() {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const admin = isPreviewAdmin(user);

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Mais</h1>
      <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-card">
        {admin ? null : (
          <li>
            <Link href="/painel/plano" className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block font-medium">Plano</span>
                <span className="block text-sm text-text-soft">{PLAN_PRICE_LABEL}</span>
              </span>
              <span className="text-text-soft">›</span>
            </Link>
          </li>
        )}
        <li>
          <a
            href={companyPublicUrl(user.company.slug)}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
          >
            <span>
              <span className="block font-medium">Ver página pública</span>
              <span className="block text-sm text-text-soft">Como o cliente vê você</span>
            </span>
            <span className="text-text-soft">›</span>
          </a>
        </li>
        <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
          <span>
            <span className="block font-medium">Conta</span>
            <span className="block text-sm text-text-soft">{user.email}</span>
          </span>
          <LogoutButton className="text-sm font-medium text-no" />
        </li>
      </ul>
    </>
  );
}
