# 04 — Home interativa: copy, componentes e animação

Resposta ao briefing de refatoração estética da home. Base: `src/app/page.tsx` atual, `docs/orcah-home-copy-reformulacao.md` (tom de voz), `docs/02_IDENTIDADE_VISUAL.md` (regras de cor) e `src/app/globals.css` (tokens).

Aplicado em `src/app/page.tsx`, `src/app/globals.css` e `src/components/home/`. O passo 1 usa “Dá para fazer na hora do almoço”, porque “leva 5 minutos” ainda não foi medido com prestadores reais.

---

## 0. Decisões antes do desenho

Três pontos do briefing mudam, porque batem de frente com o produto ou com o celular do público:

| Pedido | Decisão | Por quê |
| --- | --- | --- |
| Framer Motion | **CSS + um hook de 20 linhas** (`IntersectionObserver` + `requestAnimationFrame`) | Framer Motion não está instalado e soma ~35 KB de JS na página mais importante do funil. Tudo o que foi pedido (contador, troca de aba, status mudando, stepper por rolagem) sai com transição CSS. Celular barato e 4G fraco são o público. |
| Glassmorphism | **Card branco sólido + sombra leve.** Blur só no header fixo | Vidro fosco precisa de algo colorido atrás para aparecer. Sobre `#F5F7FA` ele fica invisível e ainda custa GPU. O próprio `02_IDENTIDADE_VISUAL.md` proíbe brilho em superfície de marca. O efeito "Aero" vem da profundidade (camadas, sombra, sobreposição de cards), não do blur. |
| Aba "Avaliações" no celular | **Trocar por "Pedir orçamento"** | O Orçah não tem avaliações. Mostrar na home algo que o produto não entrega vira reclamação no primeiro dia. |

Regras que valem para todos os blocos:

1. **Um botão dourado por dobra.** Nos mockups, o botão dourado é desenho, não CTA: fica menor e sem hover, para não competir com "Começar grátis".
2. **Verde `zap` só em WhatsApp.** O status "Aprovado" usa `ok` (`#166534` sobre `#E7F6ED`), não o verde do Zap.
3. **Dourado nunca é tinta sobre claro.** Número em destaque sobre branco usa `ink`; kicker e passo ativo usam `gold-deep`; `gold` só como preenchimento.
4. **Toda animação respeita `prefers-reduced-motion`.** Quem desligou animação no sistema vê o estado final direto (total cheio, status aprovado, passo 4 aceso).
5. **Nada anima enquanto está fora da tela.** Começa quando entra na viewport e roda uma vez; o loop do bloco 3 pausa quando sai.
6. **Duração curta:** 150–300 ms em transição de UI, até 1,6 s no contador. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.

### Tokens novos (em `src/app/globals.css`)

```css
:root {
  --shadow-card: 0 1px 2px rgb(21 31 56 / 0.04), 0 8px 24px rgb(21 31 56 / 0.06);
  --shadow-float: 0 2px 4px rgb(21 31 56 / 0.06), 0 16px 40px rgb(21 31 56 / 0.12);
  --ease-out-soft: cubic-bezier(0.2, 0.8, 0.2, 1);
}

@theme inline {
  --shadow-card: var(--shadow-card);
  --shadow-float: var(--shadow-float);
  --ease-soft: var(--ease-out-soft);
  --animate-rise: rise 400ms var(--ease-out-soft) both;
  --animate-pop: pop 300ms var(--ease-out-soft) both;
}

@keyframes rise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}

@keyframes pop {
  0%   { transform: scale(0.8); opacity: 0; }
  60%  { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

Classes resultantes: `shadow-card`, `shadow-float`, `ease-soft`, `animate-rise`, `animate-pop`. O raio continua `rounded-box` (20px, já maior que `rounded-2xl`); o celular usa `rounded-[2rem]`.

### Hooks compartilhados (`src/components/home/motion.ts`)

```ts
"use client";

import { useEffect, useRef, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.4 }) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), options);
    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);
  return { ref, inView };
}

export function useCountUp(target: number, start: boolean, duration = 1600) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let frame = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - begin) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, duration, reduced]);
  return value;
}
```

A página continua Server Component. Só os mockups animados viram `"use client"`, cada um no seu arquivo em `src/components/home/`. O texto (título, parágrafo, CTA) segue renderizado no servidor, então SEO e primeira pintura não mudam.

---

## BLOCO 1 — Hero

### Copy

**Kicker** (pequeno, `gold-deep`): Para quem vive de serviço

**Título:**

> Orçamento bonito no WhatsApp.
> Cliente aprova com um toque.

**Subtítulo:**

> Monte o orçamento pelo celular em poucos minutos, mande o link no WhatsApp e veja quando o cliente abriu. Sem papel, sem PDF borrado, sem "vou ver e te falo".

**CTA dourado:** Criar meu primeiro orçamento
**CTA secundário (texto, com seta):** Ver como funciona
**Microcopy:** 7 dias grátis · Sem cartão · R$ 29/mês depois

Alternativa para teste A/B (mantém a atual, que já é boa):

> Mostre seu trabalho. Envie o orçamento. **Feche o serviço.**

Por que mudar: a atual lista três ações iguais. A nova põe o resultado que o prestador quer (cliente aprovando) na frente e usa a palavra que ele já fala ("WhatsApp"). "Vou ver e te falo" é a dor real, dita do jeito que ele ouve.

### Layout

- **Mobile (empilhado):** kicker → título (28px, `leading-tight`) → subtítulo → CTA dourado full-width → microcopy → celular animado, cortado pela metade na primeira dobra. O corte convida a rolar.
- **Desktop (`lg:grid-cols-[1.1fr_1fr]`):** texto à esquerda, celular à direita, levemente girado (`-rotate-2`), com dois cards flutuando por fora da moldura: "Cliente visualizou · agora" em cima à esquerda e "Aprovado ✓" embaixo à direita. Os cards flutuantes são o toque "Aero": profundidade por camada, não por blur.
- Fundo: `bg-paper` liso. O celular leva `shadow-float`; os cards flutuantes, `shadow-card`.

### Interatividade simulada: o orçamento se monta sozinho

Sequência que roda **uma vez**, quando o celular entra na tela (cerca de 3,5 s no total):

| Tempo | O que acontece no celular |
| --- | --- |
| 0 ms | Esqueleto: cabeçalho "Pintura Norte", três linhas cinza pulsando, total "R$ 0,00" |
| 300 ms | Item 1 desliza (`animate-rise`): "Pintura interna — 80 m²" · R$ 1.840 |
| 900 ms | Item 2 desliza: "Massa corrida" · R$ 610 |
| 1.000 ms | Total conta de R$ 0 a R$ 2.450,00 em 1,6 s (`useCountUp`) |
| 2.700 ms | Botão "Enviar no WhatsApp" (`bg-zap`) ganha um anel pulsando uma vez |
| 3.200 ms | Card flutuante "Cliente visualizou · agora" entra (`animate-pop`) |

Depois disso, para. Não fica em loop: loop no hero cansa e disputa atenção com o CTA.

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/money";
import { useCountUp, useInView, usePrefersReducedMotion } from "./motion";

const items = [
  { name: "Pintura interna — 80 m²", price: 1840, at: 300 },
  { name: "Massa corrida", price: 610, at: 900 },
];

export function HeroQuoteDemo() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (inView) setStarted(true);
  }, [inView]);

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      setElapsed(99999);
      return;
    }
    const timers = [300, 900, 1000, 2700, 3200].map((ms) => setTimeout(() => setElapsed(ms), ms));
    return () => timers.forEach(clearTimeout);
  }, [started, reduced]);

  const total = useCountUp(2450, elapsed >= 1000);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[300px] lg:-rotate-2">
      <div className="rounded-[2rem] border border-ink-line bg-ink p-2 shadow-float">
        <div className="overflow-hidden rounded-[1.5rem] bg-paper p-3 text-text">
          <p className="text-[11px] text-text-soft">Pintura Norte · Orçamento</p>
          <div className="mt-3 space-y-2">
            {items.map((item) =>
              elapsed >= item.at ? (
                <div key={item.name} className="animate-rise rounded-xl bg-card p-3 shadow-card">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-text-soft">{formatBRL(item.price)}</p>
                </div>
              ) : (
                <div key={item.name} className="h-[58px] animate-pulse rounded-xl bg-paper-alt" />
              ),
            )}
          </div>
          <div className="mt-3 rounded-xl bg-card p-3 shadow-card">
            <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-text-soft">Total</p>
            <p className="text-2xl font-semibold tabular-nums">{formatBRL(total)}</p>
          </div>
          <p
            className={`mt-3 rounded-btn bg-zap py-2.5 text-center text-sm font-semibold text-ink transition-shadow duration-300 ${
              elapsed >= 2700 ? "ring-4 ring-zap/30" : ""
            }`}
          >
            Enviar no WhatsApp
          </p>
        </div>
      </div>
      {elapsed >= 3200 ? (
        <div className="absolute -left-6 top-10 animate-pop rounded-xl bg-card px-3 py-2 text-xs font-medium shadow-card">
          <span className="text-wait">●</span> Cliente visualizou · agora
        </div>
      ) : null}
    </div>
  );
}
```

`tabular-nums` evita que o número "dance" de largura enquanto conta. Leitor de tela: o total real fica num `<span className="sr-only">R$ 2.450,00</span>`, e o contador visual leva `aria-hidden`.

---

## BLOCO 2 — Sua página

### Copy

**Kicker:** Sua página

**Título:**

> Chega de mandar 50 fotos soltas no WhatsApp.

**Texto:**

> Quando o cliente pergunta "tem foto de algum trabalho seu?", você manda um link só. Ali ele vê seus serviços, as fotos organizadas e um botão para pedir orçamento. Funciona na bio do Instagram, no status do WhatsApp e no Google.

**Endereço em destaque** (fonte mono, `ink`): `pintura-norte.orcah.com.br`

**Três provas curtas** (ícone + frase, em linha no desktop e em coluna no mobile):

- Fotos por trabalho, não por data
- Serviços com descrição
- Pedido de orçamento chega no seu painel

**CTA secundário (contorno):** Criar minha página

A seção atual "Não mande só seu WhatsApp. Mostre o que você faz." é absorvida aqui: é a mesma dor, dita duas vezes em seguida. Vira uma seção a menos na home.

### Layout

- Desktop: celular à **esquerda** e texto à direita (inverte o hero, quebra a monotonia).
- Mobile: texto primeiro, celular depois.
- Fundo da seção: `bg-card` (branco) com o celular sobre um retângulo `bg-paper-alt` arredondado atrás, deslocado 16px, para dar camada.

### Interação: abas do celular

Três abas, clicáveis de verdade: **Trabalhos · Serviços · Pedir orçamento**.

- A aba ativa tem sublinhado `bg-gold` de 2px que **desliza** entre as abas (`transition-transform` num único `<span>` posicionado por `translateX`).
- O conteúdo troca com fade + deslize de 8px (150 ms).
- **Avanço automático a cada 4 s** enquanto a seção está visível. Parou de avançar para sempre no primeiro toque do usuário: quem mexeu quer controlar.
- Conteúdo de cada aba:
  - **Trabalhos:** grade 2×2 de fotos (Fachada, Sala, Muro, Acabamento). Toque numa foto → ela cresce na tela do celular (`scale` de 1 para a largura toda), igual à galeria real de `/orcamento/[token]`.
  - **Serviços:** três cards (Pintura interna, Externa, Textura) com "a partir de R$ 25/m²".
  - **Pedir orçamento:** mini-formulário com os campos se preenchendo sozinhos (nome → bairro → "Pintar sala e cozinha") e, ao fim, um toast "Pedido enviado ✓".

```tsx
"use client";

import { useEffect, useState } from "react";
import { useInView } from "./motion";

const tabs = ["Trabalhos", "Serviços", "Pedir orçamento"] as const;

export function PagePhoneDemo() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.5 });
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!inView || touched) return;
    const id = setInterval(() => setActive((i) => (i + 1) % tabs.length), 4000);
    return () => clearInterval(id);
  }, [inView, touched]);

  return (
    <div ref={ref} className="mx-auto w-full max-w-[300px] rounded-[2rem] border border-ink-line bg-ink p-2 shadow-float">
      <div className="overflow-hidden rounded-[1.5rem] bg-paper text-text">
        <div className="px-4 pb-3 pt-5 text-center">
          <p className="font-semibold">Pintura Norte</p>
          <p className="text-xs text-text-soft">Pintor · Maravilha-SC e Região</p>
        </div>
        <div role="tablist" className="relative grid grid-cols-3 border-b border-line text-xs font-medium">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              role="tab"
              aria-selected={active === i}
              onClick={() => {
                setTouched(true);
                setActive(i);
              }}
              className={`min-h-11 transition-colors ${active === i ? "text-text" : "text-text-soft"}`}
            >
              {tab}
            </button>
          ))}
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-0.5 w-1/3 bg-gold transition-transform duration-300 ease-soft"
            style={{ transform: `translateX(${active * 100}%)` }}
          />
        </div>
        <div key={active} role="tabpanel" className="h-[260px] animate-rise p-3">
          {/* conteúdo da aba ativa */}
        </div>
      </div>
    </div>
  );
}
```

O `key={active}` no painel remonta o conteúdo e dispara o `animate-rise` a cada troca, sem biblioteca.

---

## BLOCO 3 — Orçamentos e acompanhamento

Junta as duas seções atuais ("Orçamentos profissionais sem complicação" e "O orçamento não termina quando você aperta enviar") num bloco só, porque o que vende é a sequência inteira: montar → mandar → acompanhar.

### Copy

**Kicker:** Depois que você manda

**Título:**

> Você sabe a hora que o cliente abriu.

**Texto:**

> Orçamento mandado no WhatsApp costuma sumir na conversa. No Orçah, cada link avisa você: quando o cliente abriu, quando aprovou, quando pediu para mudar alguma coisa. Nada de ficar mandando "e aí, viu?".

**Os quatro status** (viram a legenda da animação, não uma grade de cards):

| Status | Frase |
| --- | --- |
| Enviado | Link foi pelo WhatsApp. |
| Visualizado | Ele abriu. É a hora de ligar. |
| Alteração pedida | Quer mudar algo. Responda e mande de novo. |
| Aprovado | Fechado. O aviso chega na hora. |

"Recusado" sai da vitrine: existe no produto, mas não vende na home. Aparece no FAQ ("E se o cliente recusar?" → "Você recebe o motivo: preço, prazo ou outro. Dá para ajustar e reenviar.").

### Layout

- Desktop: à esquerda o texto e a lista de status como **linha do tempo vertical** (bolinha + linha fina `bg-line`); à direita o **card do orçamento** que muda de estado.
- Mobile: o card primeiro, fixo no topo da seção com `sticky top-20`, e a linha do tempo rolando embaixo. Cada status acende quando passa pelo meio da tela.

### Animação: fluxo de notificação em loop

Loop de cerca de 8 s, **só enquanto visível** (pausa fora da tela):

1. **Enviado (0 s):** balão verde de WhatsApp entra pela direita com o link `orcah.com.br/orcamento/8F4K92` e dois tiques cinza. Pill do card: cinza, "Enviado".
2. **Visualizado (2 s):** os tiques do balão ficam azuis. Pill vira `wait-wash / wait`, "Visualizado", com um toast no topo do card: "Maria abriu seu orçamento".
3. **Alteração (4 s):** balão de resposta do cliente, à esquerda: "Dá pra fazer sem a massa corrida?". Pill fica "Alteração pedida".
4. **Aprovado (6 s):** a pill faz `animate-pop` para `ok-wash / ok` com um ✓ desenhado por `stroke-dashoffset` (a linha do check "se escreve" em 300 ms). A borda do card vira `ok` por 1 s.
5. **(8 s):** fade out e recomeça.

Na linha do tempo ao lado, o passo atual acende (bolinha preenchida em `ink`, texto em `text`); os passos já feitos ficam com a bolinha preenchida e os futuros, só com contorno.

```tsx
"use client";

import { useEffect, useState } from "react";
import { useInView, usePrefersReducedMotion } from "./motion";

const steps = [
  { label: "Enviado", pill: "bg-paper-alt text-text-soft" },
  { label: "Visualizado", pill: "bg-wait-wash text-wait" },
  { label: "Alteração pedida", pill: "bg-wait-wash text-wait" },
  { label: "Aprovado", pill: "bg-ok-wash text-ok" },
] as const;

export function StatusFlowDemo() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) {
      setStep(3);
      return;
    }
    if (!inView) return;
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 2000);
    return () => clearInterval(id);
  }, [inView, reduced]);

  const current = steps[step];

  return (
    <div ref={ref} className="rounded-box bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Maria Silva</p>
          <p className="text-xs text-text-soft">Pintura interna · R$ 2.450,00</p>
        </div>
        <span key={step} className={`animate-pop rounded-full px-2.5 py-1 text-[11px] font-semibold ${current.pill}`}>
          {current.label}
        </span>
      </div>
      {/* balões de WhatsApp e toast, condicionados a `step` */}
      <p className="sr-only" aria-live="polite">
        Status: {current.label}
      </p>
    </div>
  );
}
```

Check desenhado:

```css
.check-draw path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  transition: stroke-dashoffset 300ms var(--ease-out-soft);
}
.check-draw[data-on="true"] path {
  stroke-dashoffset: 0;
}
```

---

## BLOCO 4 — Do primeiro contato ao orçamento aprovado

### Copy

**Título:**

> Do Instagram ao "pode fazer".

**Subtítulo:** Quatro passos. Tudo no celular.

| Passo | Título | Texto | Micro-tela |
| --- | --- | --- | --- |
| 1 · Mostrar | Monte sua página | Nome, serviços e as melhores fotos. Leva 5 minutos. | Página "Pintura Norte" com grade de fotos |
| 2 · Receber | Coloque o link na bio | O cliente vê seu trabalho e pede orçamento ali mesmo. | Notificação "Novo pedido: Pintar sala e cozinha" |
| 3 · Orçar | Monte e mande no Zap | Escolha os itens do seu ramo, ponha o preço e toque em enviar. | Formulário com total e botão verde |
| 4 · Acompanhar | Veja a resposta | Abriu, aprovou ou pediu mudança: você fica sabendo na hora. | Lista com pill "Aprovado" |

"Leva 5 minutos" só entra se for verdade no teste com 3 prestadores reais. Se não for, trocar por "Dá para fazer na hora do almoço".

### Layout: stepper preso na rolagem

- **Desktop:** duas colunas. À esquerda, os quatro passos em lista, cada um com uns 60vh de altura para dar rolagem. À direita, um celular `sticky top-24` que troca a micro-tela conforme o passo que está no meio da viewport.
- **Mobile:** sem sticky (espaço curto). Cada passo é um card com a micro-tela embaixo do texto, e uma **barra de progresso fina** no topo da seção (`h-1`, `bg-gold`, largura = passo/4) mostra onde a pessoa está.
- **Passo ativo:** número em círculo `bg-gold text-ink`, título em `text`, card com `shadow-card` e borda `border-gold/40`.
- **Passos inativos:** número em contorno `border-line text-text-soft`, título em `text-soft`, sem sombra.
- Linha vertical ligando os passos: fundo `bg-line`, com uma segunda linha `bg-gold` por cima que cresce (`scaleY`) até o passo ativo.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function FlowStepper({ steps }: { steps: { title: string; text: string; screen: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <ol className="relative">
        <span aria-hidden className="absolute left-4 top-0 h-full w-px bg-line" />
        <span
          aria-hidden
          className="absolute left-4 top-0 h-full w-px origin-top bg-gold transition-transform duration-500 ease-soft"
          style={{ transform: `scaleY(${(active + 1) / steps.length})` }}
        />
        {steps.map((step, i) => (
          <li
            key={step.title}
            ref={(node) => {
              refs.current[i] = node;
            }}
            data-index={i}
            aria-current={active === i ? "step" : undefined}
            className="relative pb-10 pl-12 lg:min-h-[60vh]"
          >
            <span
              className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ${
                i <= active ? "bg-gold text-ink" : "border border-line bg-card text-text-soft"
              }`}
            >
              {i + 1}
            </span>
            <h3 className={`font-semibold transition-colors ${active === i ? "text-text" : "text-text-soft"}`}>{step.title}</h3>
            <p className="mt-1 text-sm text-text-soft">{step.text}</p>
            <div className="mt-4 lg:hidden">{step.screen}</div>
          </li>
        ))}
      </ol>
      <div className="hidden lg:block">
        <div className="sticky top-24">
          <div key={active} className="animate-rise">
            {steps[active].screen}
          </div>
        </div>
      </div>
    </div>
  );
}
```

O `rootMargin: "-45% 0px -45% 0px"` transforma a viewport numa faixa de 10% no meio da tela: o passo que cruza essa faixa vira o ativo. Sem cálculo de scroll e sem listener de `scroll`.

---

## Ordem da home depois da refatoração

Das 12 seções atuais para 9, sem perder argumento:

1. Header (com `backdrop-blur` e `bg-card/80` só aqui, quando rola por cima do conteúdo)
2. **Hero** com o orçamento se montando
3. Faixa de profissões (fica como está, em chips)
4. **Sua página** com abas (absorve "Não mande só seu WhatsApp")
5. **Acompanhamento** com status em fluxo (absorve "Orçamentos profissionais" e "O orçamento não termina")
6. **Fluxo em 4 passos** com stepper (absorve "Um link para divulgar. Um painel para organizar.")
7. Feito para seu ramo
8. Plano
9. FAQ → CTA final → rodapé

A seção "Recursos" sai: repete, com outras palavras, os blocos 4, 5 e 6.

---

## Arquivos que serão tocados na implementação

| Arquivo | Mudança |
| --- | --- |
| `src/app/globals.css` | Sombras, easing, keyframes `rise`/`pop`, bloco `prefers-reduced-motion` |
| `src/components/home/motion.ts` | Novo: `useInView`, `useCountUp`, `usePrefersReducedMotion` |
| `src/components/home/hero-quote-demo.tsx` | Novo: bloco 1 |
| `src/components/home/page-phone-demo.tsx` | Novo: bloco 2 |
| `src/components/home/status-flow-demo.tsx` | Novo: bloco 3 |
| `src/components/home/flow-stepper.tsx` | Novo: bloco 4 |
| `src/app/page.tsx` | Copy nova, 12 → 9 seções, troca `HeroDevices`/`PagePreview`/`BudgetPreview` pelos novos componentes |

Nenhuma dependência nova. Antes de codar, ler `node_modules/next/dist/docs/` sobre Client Components no App Router desta versão (Next 16.3.5).

### Critério de aceite

- Lighthouse mobile da home não piora mais que 3 pontos em Performance.
- Com "reduzir movimento" ligado no sistema, todos os mockups aparecem no estado final, sem nada se mexendo.
- Em 360px de largura, o CTA dourado do hero aparece sem rolar.
- Nenhum texto dourado sobre fundo claro; nenhum verde `zap` fora de botão ou balão de WhatsApp.
