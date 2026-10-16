"use client";

import { useState } from "react";
import { LiquidDock, type LiquidDockItem } from "@/components/liquid-dock";
import { Icon } from "@/components/painel-nav";
import { OrcahIcon } from "@/components/orcah-logo";

const sections = {
  home: { title: "Seu negócio, em um só lugar.", subtitle: "Tudo o que importa para seu dia de trabalho.", tag: "INÍCIO", number: "04", unit: "orçamentos esta semana", hint: "Seu painel, do seu jeito" },
  clientes: { title: "Clientes sempre por perto.", subtitle: "Histórico e contatos sem complicação.", tag: "CLIENTES", number: "28", unit: "contatos organizados", hint: "Menos procura, mais resultado" },
  orcamentos: { title: "Orçamentos em segundos.", subtitle: "Apresente seu trabalho com profissionalismo.", tag: "ORÇAMENTOS", number: "R$ 2,4 mil", unit: "em propostas enviadas", hint: "Seu próximo trabalho começa aqui" },
  pagina: { title: "Seu site, sua vitrine.", subtitle: "Um único link para compartilhar em qualquer lugar.", tag: "SUA PÁGINA", number: "326", unit: "visualizações recentes", hint: "Seu cartão de visitas online" },
  mais: { title: "Tudo sob controle.", subtitle: "Serviços, relatórios e configurações.", tag: "MAIS", number: "05", unit: "recursos à disposição", hint: "Tudo em um só toque" },
};

type Section = keyof typeof sections;
const previewItems: LiquidDockItem[] = [
  { id: "home", label: "Início", href: "#inicio", icon: <Icon id="home" /> },
  { id: "clientes", label: "Clientes", href: "#clientes", icon: <Icon id="clientes" /> },
  { id: "orcamentos", label: "Orçamento", href: "#orcamentos", icon: <OrcahIcon className="h-6 w-6" /> },
  { id: "pagina", label: "Página", href: "#pagina", icon: <Icon id="pagina" /> },
  { id: "mais", label: "Mais", href: "#mais", icon: <Icon id="mais" />, badge: 2 },
];

export function LiquidDockDemo() {
  const [active, setActive] = useState<Section>("home");
  const section = sections[active];

  return (
    <main className="min-h-screen bg-[#090c14] px-4 pb-12 pt-7 text-[#f5f7ff] sm:pt-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ffb020] text-[#131722]">
              <OrcahIcon className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-wide">ORÇAH <span className="font-light text-[#8e9cb6]">/ LAB</span></p>
              <p className="text-[11px] text-[#8190ad]">Experimentos de interface</p>
            </div>
          </div>
          <span className="rounded-full border border-[#ffb020]/35 bg-[#ffb020]/10 px-3 py-1.5 text-xs font-semibold text-[#ffd37c]">PREVIEW · NÃO PUBLICADO</span>
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_470px]">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.3em] text-[#ffbf45]">Liquid dock / conceito 01</p>
            <h1 className="text-4xl font-bold leading-[1.12] tracking-[-.055em] sm:text-6xl">
              Navegação com <span className="text-[#ffbf45]">vida própria.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#a1aec6]">
              A bolha dourada acompanha a aba, se estica durante o movimento e parece derreter dentro da barra.
              Toque em um ícone ou arraste a esfera para experimentar.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2 text-xs lg:justify-start">
              <span className="rounded-full border border-white/10 px-3 py-2 text-[#cfdbef]">Animação elástica</span>
              <span className="rounded-full border border-white/10 px-3 py-2 text-[#cfdbef]">Arrastar e soltar</span>
              <span className="rounded-full border border-white/10 px-3 py-2 text-[#cfdbef]">Identidade ORÇAH</span>
            </div>
            <p className="mt-7 text-xs leading-relaxed text-[#65718b]">
              Nesta página, as abas simulam um painel. Na branch de teste, o mesmo componente também substitui a navegação inferior real do ORÇAH no celular.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[440px] overflow-visible rounded-[36px] border border-[#34324a] bg-[#161525] p-[10px] shadow-[0_35px_90px_rgba(0,0,0,.52)]">
            <div className="relative isolate flex min-h-[590px] flex-col overflow-hidden rounded-[28px] bg-[radial-gradient(ellipse_at_50%_37%,#36223c_0%,#1e172b_45%,#10131f_86%)] px-5">
              <div className="pointer-events-none absolute left-1/2 top-[180px] -z-10 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[#ffb020]/10 blur-[90px]" />
              <div className="flex items-center justify-between pb-5 pt-6">
                <span className="text-sm font-semibold tracking-[-.02em] text-white/90">ORÇAH <span className="font-normal text-[#ffb020]">/ APP</span></span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/50">PROTÓTIPO</span>
              </div>
              <div className="my-auto pb-9 text-center" aria-live="polite">
                <div className="mb-5 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[.3em] text-white/50">
                  <span className="h-2 w-2 rounded-full bg-[#ffb020] shadow-[0_0_14px_#ffb020]" />
                  {section.tag}
                </div>
                <h2 className="mx-auto max-w-[330px] text-[36px] font-bold leading-[1.08] tracking-[-.055em] text-[#f7f6fa]">{section.title}</h2>
                <p className="mt-4 text-xs text-[#ac9fb5]">{section.subtitle}</p>
                <div className="mx-auto mt-9 max-w-[260px] rounded-[22px] border border-white/10 bg-white/[.04] px-6 py-5 shadow-[0_8px_40px_rgba(0,0,0,.08)]">
                  <p className="text-3xl font-semibold tracking-tight text-[#ffd074]">{section.number}</p>
                  <p className="mt-1 text-xs text-[#a69dac]">{section.unit}</p>
                </div>
              </div>
              <div className="mb-2 text-center text-[11px] text-[#95879b]">{section.hint}</div>
              <div className="pb-7 pt-3">
                <LiquidDock items={previewItems} activeId={active} onPreviewSelect={(id) => setActive(id as Section)} ariaLabel="Demo do menu líquido" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
