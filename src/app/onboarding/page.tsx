import { redirect } from "next/navigation";
import { BrandBar } from "@/components/brand-bar";
import { OnboardingForm } from "@/components/onboarding-form";
import { getSessionUser } from "@/lib/session";
import { appUrl } from "@/lib/urls";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect(appUrl("/login"));
  if (user.company) redirect("/painel");

  return (
    <div className="flex flex-1 flex-col bg-brand-wash text-text">
      <BrandBar />
      <main className="mx-auto flex w-full max-w-md flex-col px-4 pb-10 pt-8">
        <h1 className="mb-1 text-2xl font-semibold">Sua empresa</h1>
        <p className="mb-6 text-sm text-text-soft">
          Olá, {user.name.split(" ")[0]}. Só o essencial — o Orçah monta o resto com você.
        </p>
        <div className="rounded-box border border-line bg-card p-4 sm:p-5">
          <OnboardingForm defaultWhatsapp={user.phone ?? ""} />
        </div>
      </main>
    </div>
  );
}
