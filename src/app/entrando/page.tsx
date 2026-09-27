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

export default async function EntrandoPage({ searchParams }: { searchParams: Promise<{ bemvindo?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect(appUrl("/login"));
  if (!user.company) redirect(appUrl("/onboarding"));

  const host = (await headers()).get("host") ?? "";
  const suffix = (await searchParams).bemvindo === "1" ? "?bemvindo=1" : "";
  if (!sessionCookieIsShared() || tenantSlugFromHost(host) === user.company.slug) {
    redirect(`/painel${suffix}`);
  }

  return <StoreGate href={`${companyPublicUrl(user.company.slug)}/painel${suffix}`} />;
}
