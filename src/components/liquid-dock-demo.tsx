"use client";

import { useState, type CSSProperties } from "react";
import { LiquidDock, type LiquidDockItem } from "@/components/liquid-dock";
import { Icon } from "@/components/painel-nav";
import { OrcahIcon, OrcahLogo } from "@/components/orcah-logo";

type Section = "home" | "clientes" | "orcamentos" | "pagina" | "mais";
const previewItems: LiquidDockItem[] = [
  { id: "home", label: "Início", href: "/painel", icon: <Icon id="home" /> },
  { id: "clientes", label: "Clientes", href: "/painel/clientes", icon: <Icon id="clientes" /> },
  { id: "orcamentos", label: "Orçamento", href: "/painel/orcamentos/novo", icon: <OrcahIcon className="h-6 w-6" /> },
  { id: "pagina", label: "Página", href: "/painel/pagina", icon: <Icon id="pagina" /> },
  { id: "mais", label: "Mais", href: "/painel/mais", icon: <Icon id="mais" />, badge: 2 },
];

const palettes = [
  { id: "gold", name: "Ouro ORÇAH", accent: "#ffb020" },
  { id: "blue", name: "Azul elétrico", accent: "#4f9cf9" },
  { id: "mint", name: "Verde menta", accent: "#37c9a0" },
  { id: "coral", name: "Coral", accent: "#ff8759" },
] as const;

const customers = [
  { name: "Cliente exemplo A", initial: "A", detail: "Último contato há 2 dias", tone: "bg-amber-100 text-amber-800" },
  { name: "Cliente exemplo B", initial: "B", detail: "1 orçamento aprovado", tone: "bg-blue-100 text-blue-800" },
  { name: "Cliente exemplo C", initial: "C", detail: "Aguardando retorno", tone: "bg-violet-100 text-violet-800" },
];

function Chevron() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m9 5 7 7-7 7" /></svg>;
}

function Metric({ name, value, note }: { name: string; value: string; note: string }) {
  return <div className="rounded-[18px] border border-[#e3e8ef] bg-white p-3.5 shadow-[0_2px_8px_rgba(20,30,50,.035)]">
    <p className="text-[10px] font-semibold uppercase tracking-[.04em] text-[#65738d]">{name}</p>
    <p className="mt-1 text-[25px] font-bold tracking-[-.045em] text-[#151f38]">{value}</p>
    <p className="mt-0.5 text-[10px] text-[#77849d]">{note}</p>
  </div>;
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return <div className="mb-4">
    <h1 className="text-[23px] font-bold tracking-[-.035em] text-[#151f38]">{title}</h1>
    <p className="mt-0.5 text-[12px] text-[#67758e]">{detail}</p>
  </div>;
}

function CardLink({ label, subtitle, icon, onClick }: { label: string; subtitle: string; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-[104px] flex-col items-start rounded-[18px] border border-[#e4e9f0] bg-white p-3.5 text-left shadow-[0_2px_9px_rgba(10,20,30,.035)] transition-colors hover:border-[#ffb020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb020]">
    <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#fff4df] text-[#9c670a]">{icon}</span>
    <span className="mt-2 text-[12px] font-bold text-[#17213b]">{label}</span>
    <span className="mt-0.5 text-[10px] text-[#768299]">{subtitle}</span>
  </button>;
}

export function LiquidDockDemo() {
  const [active, setActive] = useState<Section>("home");
  const [search, setSearch] = useState("");
  const [previewForm, setPreviewForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("Proposta exemplo #002");
  const [palette, setPalette] = useState<(typeof palettes)[number]["id"]>("gold");
  const [soundOn, setSoundOn] = useState(true);
  const chosen = palettes.find((item) => item.id === palette) ?? palettes[0];

  function navigate(id: Section) {
    setNotice("");
    setActive(id);
  }
  function showDemoNotice(message: string) {
    setNotice(message);
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#dfe5ed] p-0 sm:p-5" style={{ "--demo-accent": chosen.accent } as CSSProperties}>
      <div className="flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-[#f5f7fa] shadow-[0_18px_75px_rgba(16,24,40,.16)] sm:h-[min(830px,calc(100dvh-40px))] sm:rounded-[35px] sm:border-[7px] sm:border-[#172036]">
        {/* Simula o app autenticado sem expor ou alterar dados reais. */}
        <header className="shrink-0 border-b border-[#e4e9f1] bg-white px-4 pb-3 pt-[max(.8rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-[#f1d9a7] bg-[#fff4df] text-[20px] font-bold text-[#8b5a09]">M</span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#7c889d]">Olá, Adriel 👋</p>
                <p className="truncate text-[14px] font-bold text-[#17213b]">Minha empresa</p>
                <p className="truncate text-[10px] text-[#7b869c]">Painel do prestador</p>
              </div>
            </div>
            <OrcahLogo className="h-7 w-[90px] object-contain" />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-7 pt-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-[#8290a4]">Prévia · dados simulados</span>
            <div className="flex items-center gap-1.5" role="group" aria-label="Personalização de cores da preview">
              {palettes.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  aria-label={option.name}
                  aria-pressed={palette === option.id}
                  title={option.name}
                  onClick={() => setPalette(option.id)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-[#dce2ed] bg-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#17213b]"
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: option.accent, boxShadow: palette === option.id ? "0 0 0 2px #fff, 0 0 0 3.5px #263451" : undefined }}
                  />
                </button>
              ))}
              <span className="mx-1 h-5 w-px bg-[#e0e6ee]" />
              <button
                type="button"
                aria-label={soundOn ? "Desligar som do menu" : "Ligar som do menu"}
                aria-pressed={soundOn}
                title={soundOn ? "Som ligado" : "Som desligado"}
                onClick={() => setSoundOn(!soundOn)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#e0e6ef] bg-white text-[#33415d] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#17213b]"
              >
                {soundOn ? (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6"/></svg>
                )}
              </button>
            </div>
          </div>

          {active === "home" ? <>
            <SectionHeading title="Boa tarde, Adriel 👋" detail="Veja como seu negócio está indo." />
            <button type="button" onClick={() => navigate("mais")} className="mb-4 flex w-full items-center justify-between rounded-[16px] border border-[#f5d791] bg-[#fff9ec] px-3.5 py-3.5 text-left">
              <div>
                <p className="text-[13px] font-bold text-[#1c2740]">2 novos pedidos recebidos</p>
                <p className="mt-0.5 text-[11px] text-[#6d7589]">Responda rápido e não perca oportunidades.</p>
              </div>
              <span className="text-[#aa7007]"><Chevron /></span>
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <Metric name="Acessos à página" value="326" note="últimos 7 dias" />
              <Metric name="Pedidos recebidos" value="12" note="últimos 30 dias" />
              <Metric name="Orçamentos" value="04" note="este mês" />
              <Metric name="Aprovados" value="02" note="R$ 2.480,00" />
            </div>
            <button type="button" onClick={() => navigate("orcamentos")} className="mt-4 flex w-full items-center justify-between rounded-[19px] bg-[#152039] px-4 py-4 text-left text-white shadow-[0_6px_15px_rgba(17,32,55,.15)]">
              <div>
                <p className="text-[15px] font-bold">Criar novo orçamento</p>
                <p className="mt-0.5 text-[11px] text-[#b7c2d7]">Profissional, rápido e personalizado</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[var(--demo-accent)]"><OrcahIcon className="h-7 w-7" /></span>
            </button>
            <p className="mb-2.5 mt-5 text-[11px] font-bold uppercase tracking-[.06em] text-[#65738d]">Atalhos</p>
            <div className="grid grid-cols-2 gap-2.5">
              <CardLink label="Editar página" subtitle="Fotos, contato e cores" icon={<Icon id="pagina" />} onClick={() => navigate("pagina")} />
              <CardLink label="Cadastrar serviço" subtitle="Serviços do seu negócio" icon={<Icon id="servicos" />} onClick={() => navigate("mais")} />
              <CardLink label="Ver relatórios" subtitle="Acessos e aprovações" icon={<Icon id="relatorios" />} onClick={() => navigate("mais")} />
              <CardLink label="Ver clientes" subtitle="Contatos organizados" icon={<Icon id="clientes" />} onClick={() => navigate("clientes")} />
            </div>
            <p className="mb-2.5 mt-5 text-[11px] font-bold uppercase tracking-[.06em] text-[#65738d]">Últimos orçamentos</p>
            <div className="rounded-[17px] border border-[#e4e9f0] bg-white p-3.5">
              <div className="flex items-start justify-between">
                <div><p className="text-[13px] font-semibold text-[#17213b]">Cliente exemplo A</p><p className="text-[11px] text-[#7e899c]">ORC-0002</p></div>
                <div className="text-right"><p className="text-[14px] font-bold text-[#17213b]">R$ 1.200,00</p><span className="text-[10px] text-[#9d680d]">Aguardando</span></div>
              </div>
            </div>
          </> : null}

          {active === "clientes" ? <>
            <SectionHeading title="Clientes" detail="Todos os contatos da sua empresa." />
            <label className="mb-4 block">
              <span className="sr-only">Buscar cliente de demonstração</span>
              <input className="w-full rounded-[14px] border border-[#e3e8f0] bg-white px-4 py-3 text-[13px] text-[#15203a] outline-[#ffb020]" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
            </label>
            <div className="space-y-2.5">
              {customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => <div key={c.name} className="flex items-center gap-3 rounded-[16px] border border-[#e4e9f0] bg-white p-3.5">
                <span className={"grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-bold " + c.tone}>{c.initial}</span>
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-[#19243f]">{c.name}</p><p className="mt-0.5 text-[10px] text-[#79859b]">{c.detail}</p></div>
                <Chevron />
              </div>)}
              {!customers.some(c => c.name.toLowerCase().includes(search.toLowerCase())) ? <p className="py-10 text-center text-[12px] text-[#65738d]">Nenhum cliente da demonstração encontrado.</p> : null}
            </div>
          </> : null}

          {active === "orcamentos" ? <>
            <SectionHeading title="Orçamentos" detail="Crie propostas e acompanhe cada etapa." />
            <button type="button" onClick={() => setPreviewForm(value => !value)} className="flex w-full items-center justify-between rounded-[16px] bg-[var(--demo-accent)] px-4 py-3.5 text-left text-[13px] font-bold text-[#17213b]">
              {previewForm ? "Fechar exemplo de orçamento" : "+ Novo orçamento"} <Chevron />
            </button>
            {previewForm ? <div className="mt-3 rounded-[17px] border border-[#e4e9f0] bg-white p-4">
              <p className="mb-3 text-[13px] font-bold">Criar orçamento · demonstração</p>
              <label className="block text-[11px] text-[#65738d]">Cliente<input className="mt-1.5 w-full rounded-xl border border-[#dbe1e9] px-3 py-2.5 text-[13px]" value="Cliente exemplo A" readOnly /></label>
              <label className="mt-3 block text-[11px] text-[#65738d]">Serviço<input className="mt-1.5 w-full rounded-xl border border-[#dbe1e9] px-3 py-2.5 text-[13px]" value="Pintura de ambiente" readOnly /></label>
              <button type="button" onClick={() => showDemoNotice("Exemplo visual: nenhum orçamento foi criado no sistema.")} className="mt-3 w-full rounded-xl bg-[#17213b] px-3 py-3 text-[12px] font-semibold text-white">Simular criação</button>
            </div> : null}
            <p className="mb-2.5 mt-5 text-[11px] font-bold uppercase tracking-[.06em] text-[#65738d]">Propostas recentes</p>
            {["Proposta exemplo #002", "Proposta exemplo #001"].map((item, i) => <button key={item} type="button" onClick={() => { setSelectedBudget(item); showDemoNotice(item + " selecionada (demonstração)."); }} className={"mb-2.5 flex w-full items-center justify-between rounded-[17px] border bg-white p-3.5 text-left " + (selectedBudget === item ? "border-[#f5cc78]" : "border-[#e4e9f0]")}>
              <div><p className="text-[13px] font-semibold text-[#17213b]">{item}</p><p className="mt-0.5 text-[10px] text-[#7a879f]">Cliente exemplo {i === 0 ? "A" : "B"} · {i === 0 ? "Aguardando" : "Aprovado"}</p></div>
              <div className="text-right"><p className="text-[13px] font-bold text-[#17213b]">{i === 0 ? "R$ 1.200" : "R$ 1.280"}</p><Chevron /></div>
            </button>)}
          </> : null}

          {active === "pagina" ? <>
            <SectionHeading title="Minha página" detail="Seu site profissional para compartilhar." />
            <div className="overflow-hidden rounded-[20px] border border-[#e3e8f0] bg-white">
              <div className="flex h-32 items-center justify-center bg-[linear-gradient(140deg,#14213a,#424f69)]">
                <div className="text-center text-white"><p className="text-2xl font-bold tracking-tight">Minha empresa</p><p className="mt-1 text-xs text-white/70">Seu serviço merece uma vitrine profissional</p></div>
              </div>
              <div className="p-4"><p className="text-[12px] font-bold text-[#17213b]">Sua vitrine está pronta para personalizar</p><p className="mt-1 text-[11px] text-[#68768e]">Adicione fotos, logo, serviços e WhatsApp.</p></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <CardLink label="Identidade visual" subtitle="Logo, capa e cores" icon={<Icon id="pagina" />} onClick={() => showDemoNotice("Editor visual de exemplo: nenhuma alteração foi salva.")} />
              <CardLink label="Serviços" subtitle="Exibição e preços" icon={<Icon id="servicos" />} onClick={() => showDemoNotice("A vitrine exibida usa dados ilustrativos.")} />
            </div>
            <div className="mt-4 rounded-[15px] border border-[#f2dfb9] bg-[#fff9ee] p-3.5"><p className="text-[12px] font-semibold text-[#805607]">Um link para Instagram e WhatsApp</p><p className="mt-1 text-[11px] text-[#987a48]">Mostre seus serviços e receba pedidos de orçamento.</p></div>
          </> : null}

          {active === "mais" ? <>
            <SectionHeading title="Mais opções" detail="Gerencie todos os recursos do seu negócio." />
            <div className="space-y-2.5">
              {[
                { name: "Pedidos recebidos", detail: "2 novos aguardando", icon: "pedidos" as const },
                { name: "Meus serviços", detail: "Cadastro e valores", icon: "servicos" as const },
                { name: "Relatórios", detail: "Acessos e resultados", icon: "relatorios" as const },
                { name: "Conta e plano", detail: "Preferências e assinatura", icon: "mais" as const },
              ].map(item => <button key={item.name} type="button" onClick={() => showDemoNotice(item.name + " — seção ilustrativa deste protótipo.")} className="flex w-full items-center gap-3 rounded-[16px] border border-[#e3e8ef] bg-white p-3.5 text-left">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff3df] text-[#99650b]"><Icon id={item.icon} /></span>
                <span className="flex-1"><span className="block text-[13px] font-semibold text-[#18243f]">{item.name}</span><span className="text-[10px] text-[#738099]">{item.detail}</span></span><Chevron />
              </button>)}
            </div>
          </> : null}

          {notice ? <div role="status" className="mt-4 rounded-[13px] border border-[#edd093] bg-[#fff9e9] p-3 text-[11px] text-[#805605]">{notice}</div> : null}
        </div>

        <div className="relative z-10 shrink-0 border-t border-[#e3e8f0]/30 bg-[#f5f7fa] px-3 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1">
          <LiquidDock
            items={previewItems}
            activeId={active}
            accent={chosen.accent}
            soundEnabled={soundOn}
            onPreviewSelect={(id) => navigate(id as Section)}
            ariaLabel="Menu móvel do painel ORÇAH — demonstração"
          />
        </div>
      </div>
    </main>
  );
}
