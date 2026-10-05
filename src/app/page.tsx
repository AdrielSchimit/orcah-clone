import homeButtons from "@/components/home/home-buttons.module.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { FlowSection } from "@/components/home/flow-stepper";
import { HomeCommercialHero } from "@/components/home/home-commercial-hero";
import { HomeMobileStickyCta } from "@/components/home/home-mobile-sticky-cta";
import { PagePhoneDemo } from "@/components/home/page-phone-demo";
import { StatusSection } from "@/components/home/status-flow-demo";
import { OrcahLogo } from "@/components/orcah-logo";
import { PLAN_PRICE_LABEL, TRIAL_DAYS } from "@/lib/plan-constants";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session-token";
import { appUrl, companyPublicUrl } from "@/lib/urls";

const DEMO_SLUG = "pintura-norte";

const trades = [
  "Pedreiro",
  "Eletricista",
  "Pintor",
  "Marceneiro",
  "Serralheiro",
  "Mecânico",
  "Encanador",
  "Fotógrafo",
  "Gesseiro",
  "Montador de móveis",
  "Técnico",
];

const sectionNav = [
  ["Como funciona", "#como-funciona"],
  ["Planos", "#plano"],
  ["Orçamentos", "#orcamentos"],
  ["Perguntas", "#perguntas"],
] as const;

const faqs = [
  ["Preciso de cartão para começar?", "Não. O teste começa sem cartão."],
  [
    "O cliente precisa instalar algum aplicativo?",
    "Não. O cliente abre a página e o orçamento no navegador do celular.",
  ],
  ["Posso usar pelo celular?", "Sim. O Orçah foi pensado para funcionar no celular."],
  [
    "Posso colocar o link da minha página no Instagram?",
    "Sim. Sua página serve como o link da bio e também no WhatsApp e em outras redes.",
  ],
  ["Posso colocar fotos dos meus trabalhos?", "Sim. Sua página mostra os trabalhos com fotos e informações."],
  [
    "O cliente consegue pedir orçamento pela minha página?",
    "Sim. Tem um botão para o visitante solicitar um orçamento.",
  ],
  ["Posso enviar o orçamento pelo WhatsApp?", "Sim. Você manda o link do orçamento direto para o cliente."],
  [
    "O cliente consegue aprovar o orçamento?",
    "Sim. Ele abre o orçamento e pode aprovar, recusar ou pedir alteração.",
  ],
  [
    "E se o cliente recusar?",
    "Você recebe o motivo: preço, prazo ou outro. Dá para ajustar e reenviar.",
  ],
  [
    "Preciso usar PDF?",
    "Não. O link é o formato principal para o cliente abrir e responder. O PDF continua disponível quando você precisar.",
  ],
  ["Posso cancelar quando quiser?", "Sim. Cancele quando quiser."],
  [
    "O Orçah serve para qual profissão?",
    "Para dezenas de prestadores de serviço, com moldes que se adaptam ao ramo.",
  ],
];

async function viewerIsLoggedIn() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    return Boolean(await readSessionToken(token));
  } catch {
    return false;
  }
}

export default async function Home() {
  const loggedIn = await viewerIsLoggedIn();
  const providerAreaHref = loggedIn ? appUrl("/painel") : appUrl("/login");
  const providerAreaLabel = loggedIn ? "Acessar painel" : "Área do prestador";

  return (
    <div className="flex flex-1 flex-col bg-paper">
      <HomeCommercialHero loggedIn={loggedIn} providerAreaHref={providerAreaHref} providerAreaLabel={providerAreaLabel} links={sectionNav} />

      <section id="oficios" className="scroll-mt-20 bg-paper px-4 pb-16 pt-2 md:pb-24 md:pt-3">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-2xl font-semibold md:text-3xl">Feito para quem vive de serviço</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {trades.map((trade) => (
              <span key={trade} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-text shadow-card">
                {trade}
              </span>
            ))}
            <a href="#ramo" className="rounded-full border border-line px-4 py-2 text-sm text-text-soft">
              +80 profissões
            </a>
          </div>
        </div>
      </section>

      <section id="pagina" className="scroll-mt-20 bg-card px-4 py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div className="lg:order-2">
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Sua página</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Chega de mandar 50 fotos soltas no WhatsApp.</h2>
            <p className="mt-3 max-w-md text-text-soft">
              Quando o cliente pergunta “tem foto de algum trabalho seu?”, você manda um link só. Ali ele vê seus
              serviços, as fotos organizadas e um botão para pedir orçamento. Funciona na bio do Instagram, no status
              do WhatsApp e no Google.
            </p>
            <p className="mt-4 break-all font-mono text-lg font-semibold text-text md:text-2xl">pintura-norte.orcah.com.br</p>
            <ul className="mt-6 space-y-3 text-sm font-medium">
              {["Fotos por trabalho, não por data", "Serviços com descrição e preço", "Pedido de orçamento chega no seu painel"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check />
                    {item}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={companyPublicUrl(DEMO_SLUG)}
                className="inline-flex min-h-12 items-center rounded-btn bg-ink px-5 text-sm font-semibold text-ink-text"
              >
                Abrir a loja de exemplo
              </a>
              <Link href={appUrl("/cadastro")} className="inline-flex min-h-12 items-center px-2 text-sm font-semibold text-text">
                Criar a minha →
              </Link>
            </div>
          </div>
          <div className="lg:order-1">
            <PagePhoneDemo />
          </div>
        </div>
      </section>

      <StatusSection />
      <FlowSection />

      <section id="ramo" className="scroll-mt-20 bg-paper px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-2xl font-semibold md:text-3xl">Seu serviço não é igual ao de todo mundo.</h2>
          <p className="mt-3 max-w-xl text-text-soft">
            O Orçah foi pensado para diferentes tipos de prestadores de serviço. Encontre moldes e configurações do
            seu ramo e adapte à maneira que você trabalha.
          </p>
          <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Obras e reformas", "Pedreiro · Pintor · Gesseiro · Azulejista · Eletricista · Encanador"],
              ["Casa e móveis", "Marceneiro · Móveis planejados · Montador · Serralheiro · Vidraceiro"],
              ["Técnicos e manutenção", "Técnico de informática · Ar-condicionado · Assistência técnica"],
              ["Automotivo", "Mecânico · Funileiro · Pintor automotivo · Borracharia"],
              ["Serviços e profissionais", "Fotógrafo · Designer · Eventos · Instalações"],
            ].map(([title, text]) => (
              <li key={title} className="rounded-box border border-line bg-card p-5 shadow-card">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-text-soft">{text}</p>
              </li>
            ))}
          </ul>
          <a href="#oficios" className="mt-6 inline-flex min-h-12 items-center text-sm font-semibold">
            Ver profissões
          </a>
        </div>
      </section>

      <section id="plano" className="scroll-mt-20 bg-paper-alt px-4 py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Um plano só</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-4xl md:leading-tight">Um preço só. Tudo liberado.</h2>
            <p className="mt-3 max-w-md text-text-soft">
              Sem plano básico cortado, sem limite de orçamento, sem taxa por cliente. Um orçamento aprovado já paga meses de plano.
            </p>
            <ul className="mt-6 space-y-3 text-sm font-medium">
              {[`${TRIAL_DAYS} dias grátis para testar`, "Sem cartão para começar", "Cancele quando quiser, sem multa"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-[2rem] bg-card shadow-float ring-1 ring-line">
            <div className="bg-ink px-6 py-6 text-ink-text md:px-8">
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-ink-soft">Plano Orçah</p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">{PLAN_PRICE_LABEL.split("/")[0]}</span>
                <span className="text-ink-soft">/mês</span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">Tudo liberado desde o primeiro dia.</p>
            </div>
            <div className="px-6 py-6 md:px-8">
              <ul className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[
                  "Orçamentos ilimitados",
                  "Página profissional",
                  "Portfólio com fotos",
                  "Serviços e produtos",
                  "Pedidos de orçamento",
                  "Aviso de visualização",
                  "Aprovação pelo link",
                  "PDF quando precisar",
                  "Moldes do seu ramo",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check small />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={appUrl("/cadastro")}
                className={`mt-7 flex min-h-12 items-center justify-center rounded-btn bg-gold px-6 font-semibold text-ink transition-colors hover:bg-gold-press ${homeButtons.gold}`}
              >
                Começar {TRIAL_DAYS} dias grátis
              </Link>
              <p className="mt-3 text-center text-xs text-text-soft">Depois, {PLAN_PRICE_LABEL}. Sem fidelidade.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="perguntas" className="scroll-mt-20 bg-paper px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="text-2xl font-semibold md:text-3xl">Perguntas frequentes</h2>
          <div className="mt-4 divide-y divide-line rounded-box border border-line bg-card shadow-card">
            {faqs.map(([q, a]) => (
              <details key={q} className="px-4">
                <summary className="flex min-h-12 cursor-pointer items-center font-medium">{q}</summary>
                <p className="pb-3 text-sm text-text-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-deep px-4 py-16 text-center text-ink-text md:py-24">
        <h2 className="text-2xl font-semibold md:text-3xl">Seu próximo cliente pode estar a um link de distância.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
          Crie sua página, mostre seu trabalho e envie seu primeiro orçamento pelo Orçah.
        </p>
        <Link
          href={appUrl("/cadastro")}
          className={`mt-5 inline-flex min-h-12 items-center rounded-btn bg-gold px-6 font-semibold text-ink ${homeButtons.gold}`}
        >
          Começar grátis
        </Link>
        <p className="mt-3 text-sm text-ink-soft">
          {TRIAL_DAYS} dias grátis · Sem cartão · {PLAN_PRICE_LABEL} depois
        </p>
      </section>

      <footer className="bg-ink-deep px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 text-ink-text md:pb-16 md:pt-0">
        <div className="mx-auto grid w-full max-w-5xl gap-10 border-t border-ink-line pt-10 md:grid-cols-4 md:pt-14">
          <div>
            <OrcahLogo variant="dark" className="h-8 w-auto" />
            <p className="mt-1 text-sm text-ink-soft">Seu trabalho. Sua página. Seus orçamentos.</p>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Para prestadores de serviço criarem páginas profissionais, receberem pedidos de orçamento, enviarem
              propostas pelo WhatsApp e acompanharem as respostas dos clientes.
            </p>
          </div>
          <nav aria-label="Produto">
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-ink-soft">Produto</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#pagina">Sua página</a></li>
              <li><a href="#orcamentos">Orçamentos</a></li>
              <li><a href="#ramo">Profissões</a></li>
              <li><a href="#plano">Plano</a></li>
              <li><a href="#perguntas">Perguntas</a></li>
            </ul>
          </nav>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-ink-soft">Profissões</p>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              Pedreiro · Eletricista · Pintor · Marceneiro · Serralheiro · Mecânico · Encanador · +80 profissões
            </p>
            <a href="#oficios" className="mt-3 inline-block text-sm">Ver profissões</a>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-ink-soft">Legal</p>
            <p className="mt-3 text-sm text-ink-soft">orcah.com.br</p>
            <p className="mt-2 text-sm text-ink-soft">Termos, privacidade e CNPJ entram no lançamento.</p>
          </div>
        </div>
        <p className="mx-auto mt-10 w-full max-w-5xl text-xs text-ink-soft">© 2026 Orçah</p>
      </footer>

      <HomeMobileStickyCta />
    </div>
  );
}

function Check({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-ok-wash text-ok ${small ? "h-5 w-5" : "h-6 w-6"}`}
    >
      <svg viewBox="0 0 16 16" className={small ? "h-3 w-3" : "h-3.5 w-3.5"} fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
