import Link from "next/link";
import { MascoteVazio } from "@/components/mascote";
import { ServiceList } from "@/components/service-list";
import { prisma } from "@/lib/db";
import { publicServiceOrder, serializeService } from "@/lib/services";
import { getSessionUser } from "@/lib/session";

export default async function ServicosPage({ searchParams }: { searchParams: Promise<{ salvo?: string }> }) {
  const user = await getSessionUser();
  if (!user?.company) return null;
  const saved = (await searchParams).salvo === "1";

  const services = await prisma.service.findMany({
    where: { companyId: user.company.id },
    orderBy: [{ active: "desc" }, ...publicServiceOrder],
    take: 200,
  });

  return (
    <>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Serviços</h1>
        <Link
          href="/painel/servicos/novo"
          className="flex min-h-11 items-center rounded-btn bg-gold px-4 text-sm font-semibold text-ink hover:bg-gold-press"
        >
          + Novo serviço
        </Link>
      </div>
      <p className="mb-4 text-sm text-text-soft">
        O que você faz. Aparece na sua página e já vem pronto na hora do orçamento.
      </p>
      {saved ? <p className="mb-3 rounded-btn bg-ok-wash px-4 py-3 text-sm font-medium text-ok">Serviço salvo.</p> : null}

      {services.length === 0 ? (
        <MascoteVazio
          pose="explicando"
          action={
            <Link href="/painel/servicos/novo" className="text-gold-deep underline underline-offset-4">
              Cadastrar serviço
            </Link>
          }
        >
          Mostre o que você faz. Cadastre seus serviços para eles aparecerem na sua página.
        </MascoteVazio>
      ) : (
        <ServiceList services={services.map(serializeService)} />
      )}
    </>
  );
}
