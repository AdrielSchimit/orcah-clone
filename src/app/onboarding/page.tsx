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
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-8 pt-6 sm:pt-10">
        <div className="mb-5">
          <p className="text-sm font-medium text-text-soft">Olá, {user.name.split(" ")[0]}.</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">Vamos deixar sua empresa pronta.</h1>
        </div>
        <div className="rounded-box border border-line bg-card p-4 shadow-card sm:p-5">
          <OnboardingForm defaultWhatsapp={user.phone ?? ""} />
        </div>
      </main>
    </div>
  );
}
