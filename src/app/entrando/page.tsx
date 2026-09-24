import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StoreGate } from "@/components/store-gate";
import { getSessionUser } from "@/lib/session";
import { appUrl, companyPublicUrl, sessionCookieIsShared, tenantSlugFromHost } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Abrindo sua loja",
  robots: { index: false, follow: false },
};

export default async function EntrandoPage() {
  const user = await getSessionUser();
  if (!user) redirect(appUrl("/login"));
  if (!user.company) redirect(appUrl("/onboarding"));

  const host = (await headers()).get("host") ?? "";
  if (!sessionCookieIsShared() || tenantSlugFromHost(host) === user.company.slug) {
    redirect("/painel");
  }

  return <StoreGate href={`${companyPublicUrl(user.company.slug)}/painel`} />;
}
