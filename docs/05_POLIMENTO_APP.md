# 05 — Polimento do app do prestador (`/painel`)

> Objetivo: o painel tem que parecer um **aplicativo nativo bom** (Nubank, iFood, WhatsApp), não um site dentro do celular.
> Público: prestador de serviço, com uma mão só, no sol, com pressa, às vezes de luva ou com a mão suja.
> Regra de ouro: **cada animação responde a uma ação ou explica uma mudança de estado.** Se ela não faz nenhuma das duas, sai.

Base obrigatória: `docs/02_IDENTIDADE_VISUAL.md` (cores, uma ação dourada por tela, verde WhatsApp só para WhatsApp).
Tokens já existentes em `src/app/globals.css`: `shadow-card`, `shadow-float`, `ease-soft`, `animate-rise`, `animate-pop`, `animate-notify`, `animate-progress`.

---

## 0. Diagnóstico do que existe hoje

| Onde | Problema | Efeito no uso |
| --- | --- | --- |
| Cards (`painel/page.tsx`, listas) | Só `border border-line`, sem sombra, sem estado de toque | Parece formulário web; o dedo não "sente" o clique |
| `Stat` em `painel/page.tsx` | Ícones em texto (`↑ ◉ ✓ R$`) | Aspecto improvisado |
| `painel-nav.tsx` | Ativo com fundo `gold-wash` **e** barrinha dourada; troca seca | Dois indicadores brigando; nenhuma continuidade |
| `painel/layout.tsx` | Cabeçalho fixo de 3 linhas que rola junto | Ocupa ~110px da tela útil em todas as páginas |
| Todo o painel | Nenhum `loading.tsx`; navegação fica "parada" até o servidor responder | Parece travado em 4G fraco |
| Formulários | Feedback só troca o texto para "Salvando…" | Sem confirmação clara de sucesso, sem desfazer |
| `budget-form.tsx` (linha ~1244) | Barra de salvar empilhada sobre a nav (`bottom-[4.25rem]`) | Duas barras fixas = pouca área de conteúdo |
| Ações destrutivas | Excluir sem desfazer | Medo de tocar; erro caro |
| Números (`R$`) | Fonte proporcional | Valores "dançam" quando mudam |

---

## 1. Fundamentos (tokens)

### 1.1 Escala de arredondamento

Arredondamento **concêntrico**: raio de dentro = raio de fora − espaçamento. Nunca um card de 20px com botão interno de 20px.

| Token | Valor | Uso |
| --- | --- | --- |
| `rounded-md` | 8px | chips pequenos, badge de contador, miniatura 40px |
| `rounded-btn` | 14px | botões, inputs, itens de lista dentro de card |
| `rounded-box` | 20px | cards, blocos de conteúdo |
| `rounded-sheet` (novo) | 28px | topo de bottom sheet, modais, cartão de destaque |
| `rounded-full` | — | pills de status, avatar, FAB |

Adicionar em `@theme inline`: `--radius-sheet: 1.75rem;`

Regra prática: card `rounded-box` com `p-4` → filhos `rounded-btn` (20 − 4 ≈ 14–16). Card `rounded-sheet` com `p-2` → filhos `rounded-box`.

### 1.2 Elevação (três níveis, nada além)

| Nível | Token | Onde |
| --- | --- | --- |
| 0 | sem sombra, `bg-paper` | fundo da tela |
| 1 | `shadow-card` + `ring-1 ring-line/60` (troca a `border`) | cards, itens de lista, inputs em foco |
| 2 | `shadow-float` | barra de ação fixa, bottom sheet, toast, FAB |

Remover `border border-line` dos cards do painel e usar o nível 1. Borda fica só em inputs e divisores.

### 1.3 Espaço e toque

- Grade de 4px. Margem lateral da tela: **16px**. Espaço entre cards: **8px** em lista, **12px** entre blocos, **24px** entre seções.
- Alvo de toque mínimo **48×48px** (já é regra); ações principais **56px** de altura.
- Distância mínima entre dois alvos de toque: 8px.
- **Zona do polegar:** ação principal sempre na metade de baixo da tela. Nada importante no canto superior direito.

### 1.4 Tipografia de números

- Todo valor em `R$`, contador e data: `tabular-nums` (utilitário já existe no Tailwind).
- Total do orçamento: `text-[28px] font-semibold tracking-tight`.
- Nunca menos que 13px em informação útil. 11px só para rótulo em caixa alta.

---

## 2. Sistema de movimento

### 2.1 Durações e curvas

| Tipo | Duração | Curva | Exemplos |
| --- | --- | --- | --- |
| Toque (press) | 100ms | `ease-out` | card/botão encolhe para `scale(0.97)` |
| Micro (estado) | 160–200ms | `ease-soft` | troca de pill, check, contador |
| Entrada de elemento | 240–300ms | `ease-soft` | item novo na lista, toast, sheet |
| Saída | 160–200ms | `ease-in` | **saída é sempre mais rápida que entrada** |
| Navegação | 250ms | `ease-soft` | transição entre telas |

Curvas (adicionar em `:root`/`@theme`):

```css
--ease-soft: cubic-bezier(0.2, 0.8, 0.2, 1);    /* já existe: entradas */
--ease-exit: cubic-bezier(0.4, 0, 1, 1);         /* saídas */
--ease-spring: cubic-bezier(0.34, 1.4, 0.64, 1); /* só para confirmação: check, badge */
```

### 2.2 O que anima e por quê

| Animação | Propósito (usabilidade) |
| --- | --- |
| Press scale 0.97 em tudo que é tocável | Confirma o toque antes do servidor responder |
| Indicador da nav deslizando entre abas | Mostra de onde para onde você foi |
| Item novo "cresce" na lista (altura 0 → auto + fade) | Mostra onde o item entrou |
| Item removido encolhe + toast "Desfazer" | Mostra o que sumiu e permite voltar |
| Pill de status troca com `animate-pop` | Chama atenção para mudança de estado (ex.: "Aprovado") |
| Total conta até o novo valor ao editar item | Liga causa (item) e efeito (total) |
| Skeleton no formato real do conteúdo | Tempo de espera parece menor; nada "pula" quando carrega |
| Botão enviar → spinner → ✓ desenhado | Um único lugar mostra todo o ciclo da ação |

**Proibido:** animação em loop no painel (exceto skeleton), parallax, entrada escalonada em toda navegação, qualquer coisa acima de 400ms, animar `width/height/top/left` (use `transform`, `opacity`, `grid-template-rows`).

### 2.3 Movimento reduzido

Já existe o bloco `@media (prefers-reduced-motion: reduce)` em `globals.css`. Manter: com ele, tudo vira troca instantânea **mas o feedback continua** (cor, ícone, texto). Nenhuma informação pode depender só de animação.

---

## 3. Componentes, um por um

### 3.1 Navegação inferior (`src/components/painel-nav.tsx`)

- Um único indicador: pill `bg-gold-wash` **atrás do ícone** (64×32px, `rounded-full`), estilo Material 3. Remover a barrinha dourada do topo.
- Indicador é um único elemento absoluto que desliza com `transform: translateX(...)` 250ms `ease-soft`. Posição = índice ativo × largura da aba.
- Ícone ativo: variante preenchida (fill) em `text-ink`; inativo: traço 1.8 em `text-text-soft`.
- Rótulo sempre visível (prestador não decora ícone).
- Badge de pedidos novos: `animate-pop` quando o número **aumenta** (guardar o valor anterior em `useRef`).
- Fundo: `bg-card/90 backdrop-blur-xl` + `shadow-float` para cima; altura 64px + `env(safe-area-inset-bottom)`.
- Navegação com `useLinkStatus` (Next) para mostrar um ponto pulsando no ícone enquanto a rota carrega.

### 3.2 Cabeçalho (`src/app/painel/layout.tsx`)

- **Cabeçalho que encolhe com a rolagem** (técnica nova, só CSS, sem JS):

```css
@supports (animation-timeline: scroll()) {
  .app-header { animation: header-shrink linear both; animation-timeline: scroll(); animation-range: 0 80px; }
  @keyframes header-shrink { to { padding-block: 8px; box-shadow: var(--shadow-card); } }
  .app-header-sub { animation: fade-out linear both; animation-timeline: scroll(); animation-range: 0 48px; }
  @keyframes fade-out { to { opacity: 0; height: 0; } }
}
```

  Navegador sem suporte: fica como hoje (degrada bem).
- `sticky top-0 z-20 bg-card/85 backdrop-blur-xl`.
- Linha "Ramo · Cidade" some ao rolar; fica só logo + nome da empresa.
- À direita: botão circular 44px "Ver minha página" (ícone de olho) — o atalho mais pedido.

### 3.3 Tela Início (`src/app/painel/page.tsx`)

- **Hero do mês** no lugar dos 4 `Stat` iguais: um cartão `rounded-sheet bg-ink text-ink-text` com "Aprovado em setembro" + valor grande (`tabular-nums`, conta até o valor na primeira visita da sessão) + barra fina com enviados → vistos → aprovados (funil).
- Abaixo, 3 mini-stats horizontais (`scroll-snap-x`, deslizam) com ícones SVG de verdade (mesmo traço da nav). Remover os caracteres `↑ ◉ ✓`.
- **"Precisa de você"** acima da lista: orçamentos visualizados há mais de 24h sem resposta ("Maria abriu ontem — que tal ligar?") com botão WhatsApp direto. É a informação que mais gera dinheiro; merece o topo.
- Lista "Últimos orçamentos": agrupar por **Hoje / Esta semana / Antes** com cabeçalho `sticky`.
- Card da lista: avatar com iniciais (cor derivada do nome), nome, "Pintura interna · há 2h", valor à direita, pill embaixo do valor. Press scale.
- **Swipe no item** (opcional, fase 3): arrastar para a esquerda revela "Reenviar no WhatsApp" e "Duplicar". Sempre existir também o mesmo comando dentro da tela do orçamento (swipe nunca é o único caminho).

### 3.4 Criar orçamento (`src/components/create-budget-cta.tsx` + `budget-form.tsx`)

- CTA "Criar orçamento" vira **FAB estendido** dourado (56px, `rounded-full`, `shadow-float`) acima da nav, à direita. Ao rolar para baixo encolhe para só o ícone "+"; ao rolar para cima volta (mesma técnica de `animation-timeline` ou `IntersectionObserver`).
- Formulário em **etapas curtas** no celular: Cliente → Itens → Revisar e enviar. Indicador de progresso de 3 segmentos no topo (`animate-progress` já existe). No desktop, tudo em uma tela.
- **Barra de total fixa única**: quando o formulário está aberto, a nav inferior some (`inert` + translateY) e a barra de total ocupa o lugar dela. Nunca duas barras fixas empilhadas.
- Total na barra conta até o novo valor ao adicionar/editar item (`useCountUp` de `src/components/home/motion.ts` pode ir para `src/lib`).
- Inputs de dinheiro: `inputMode="decimal"`, `enterKeyHint="next"`, máscara `R$` ao sair do campo, `tabular-nums`.
- Inputs de quantidade: botões − / + de 44px ao lado (luva, dedo grosso).
- Item adicionado: entra com altura 0 → auto (`grid-template-rows: 0fr → 1fr`) + fade 240ms, e a tela rola até ele.
- Item removido: sai com colapso 200ms + **toast "Item removido · Desfazer"** por 5s. Nada de `confirm()`.
- Rascunho salvo automaticamente no `localStorage` a cada alteração ("Rascunho salvo" discreto no topo). Prestador é interrompido o tempo todo.
- Envio: botão verde WhatsApp → estado carregando (spinner no lugar do ícone, largura não muda) → ✓ com `.check-draw` → abre o WhatsApp. Se o Web Share API existir (`navigator.share`), oferecer "Enviar por outro app".

### 3.5 Detalhe do orçamento (`src/app/painel/orcamentos/[id]/page.tsx`)

- **Linha do tempo** vertical: Criado → Enviado → Visualizado (com hora) → Aprovado/Alteração/Recusado. Ponto atual com anel pulsando 1× ao abrir.
- Motivo da recusa/alteração em destaque (`bg-no-wash` / `bg-wait-wash`, `rounded-box`) acima de tudo.
- Barra de ação fixa com **uma** ação dourada que muda conforme o estado: rascunho → "Enviar"; visualizado sem resposta → "Cobrar no WhatsApp"; alteração pedida → "Editar e reenviar"; aprovado → "Marcar como feito".
- Ações secundárias (Duplicar, PDF, Excluir) num bottom sheet "Mais opções".
- Transição de rota lista → detalhe com **`<ViewTransition>` do React** (ver `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`): o nome do cliente e o valor "voam" do card da lista para o cabeçalho do detalhe (`name={\`budget-${id}\`}`, `share="morph"`, `default="none"`).

### 3.6 Pill de status (`src/components/status-pill.tsx`)

- Adicionar ícone de 12px antes do texto (relógio, olho, ✓, ✕, lápis). Cor nunca é o único sinal.
- Altura 24px, `px-2.5`, `text-[11px] font-semibold`.
- Prop `animateOnChange`: quando o status recebido for diferente do anterior, aplicar `animate-pop` uma vez.

### 3.7 Carregamento

- Criar `loading.tsx` em `src/app/painel/`, `painel/orcamentos/[id]/`, `painel/pedidos/`, `painel/clientes/` com **skeleton no formato exato** de cada tela (mesmos raios e alturas).
- Skeleton: `bg-paper-alt` com brilho diagonal (`background-size: 200%`, 1.2s linear infinite). Com movimento reduzido: cinza parado.
- Navegação é transição no App Router: a tela antiga fica visível enquanto a nova carrega; com `loading.tsx` o skeleton aparece em < 100ms.

### 3.8 Feedback: toast / snackbar

- Componente novo `src/components/toast.tsx` (provider no layout do painel).
- Posição: acima da nav/barra fixa, centralizado, `max-w-[calc(100%-32px)]`, `rounded-box bg-ink text-ink-text shadow-float`.
- Entrada: sobe 12px + fade 240ms; saída 160ms. Um por vez (novo substitui o anterior).
- Sempre texto de resultado ("Orçamento salvo", "Cliente cadastrado") + ação opcional ("Desfazer", "Ver").
- `role="status"` `aria-live="polite"`.
- Usar em todos os `"Salvando…"` atuais: `customer-form.tsx`, `company-profile-form.tsx`, `budget-form.tsx`, `company-gallery-form.tsx`, `budget-photos-form.tsx`.

### 3.9 Bottom sheet no lugar de modal

- Componente `src/components/sheet.tsx` com `<dialog>` nativo (`showModal()` — foco, Esc e `inert` do fundo de graça).
- Topo `rounded-t-sheet`, alça 36×4px, altura máxima `85dvh`, `overscroll-behavior: contain`.
- Arrastar a alça para baixo fecha (pointer events + `transform`); soltar abaixo de 30% da altura volta.
- Usar para: "Mais opções" do orçamento, escolher cliente no formulário, filtro de status, trocar ramo.

### 3.10 Listas de Pedidos e Clientes (`pedidos/page.tsx`, `clientes-panel.tsx`)

- Busca fixa no topo, `rounded-full`, 44px, ícone de lupa; filtra no cliente enquanto digita.
- Filtros em chips roláveis com `scroll-snap-x` (Todos · Novos · Convertidos).
- Pedido novo: ponto dourado à esquerda + fundo `gold-wash/40` até ser aberto.
- Cliente: botão WhatsApp e ligar direto no card (44px cada), sem precisar abrir.
- Estado vazio com ilustração + uma frase + um botão (ver "O que preciso de você").

### 3.11 Upload de fotos (`file-picker.tsx`, `budget-photos-form.tsx`, `company-gallery-form.tsx`)

- Miniatura aparece **na hora** (URL local com `URL.createObjectURL`) com anel de progresso por cima; a foto não espera o servidor para aparecer (UI otimista com `useOptimistic`).
- Comprimir no navegador antes de enviar (canvas → WebP 1600px, ~80%). 4G no interior agradece.
- Reordenar fotos arrastando (fase 3).

### 3.12 Página "Minha página" (`painel/empresa/page.tsx`)

- Prévia ao vivo em moldura de celular (reusar `src/components/home/phone-frame.tsx`) ao lado do formulário no desktop; no celular, botão "Pré-visualizar" abre em sheet.
- Checklist de completude no topo ("Sua página está 70% pronta": foto de capa, 4 fotos, 3 serviços, horário) com barra de progresso. Cada item leva direto ao campo.

---

## 4. Técnicas "de app" (web moderna)

| Técnica | Onde | Observação |
| --- | --- | --- |
| `<ViewTransition>` do React | lista → detalhe, troca de abas | Já suportado pelo Next 16; ler o guia em `node_modules/next/dist/docs` antes |
| `animation-timeline: scroll()` | cabeçalho e FAB encolhendo | Só CSS; usar `@supports` |
| `useOptimistic` | status, fotos, marcar pedido como visto | Rollback + toast se o servidor falhar |
| `navigator.vibrate(10)` | ao enviar, aprovar, desfazer | Só Android; iOS ignora. Nunca como único feedback |
| `<dialog>` + `inert` | sheets | Acessibilidade nativa |
| `dvh` / `env(safe-area-inset-*)` | alturas e barras fixas | Evita barra escondida atrás do teclado ou do "notch" |
| `interactive-widget=resizes-content` | viewport meta | Teclado empurra a barra de total junto |
| `navigator.share` | enviar orçamento/link da página | Fallback: copiar link + toast |
| Badging API (`navigator.setAppBadge`) | PWA instalado | Número de pedidos novos no ícone do app |
| `content-visibility: auto` | listas longas | Rolagem leve em celular fraco |
| `overscroll-behavior: contain` | sheets e listas internas | Evita puxar a página de trás |
| `touch-action: manipulation` | global | Remove atraso de toque duplo |
| `-webkit-tap-highlight-color: transparent` + press scale | global | Troca o flash azul por feedback próprio |

---

## 5. Acessibilidade e contraste

- Contraste mínimo 4.5:1 em texto (tokens já passam; conferir `text-text-soft` sobre `paper-alt`).
- Foco visível: `outline-2 outline-offset-2 outline-ink` em tudo que é interativo (teclado e leitor de tela).
- Status sempre com ícone + texto, nunca só cor.
- Toast com `aria-live`, sheet com `aria-labelledby`, nav com `aria-current="page"`.
- Tamanho de fonte respeita o zoom do sistema (nada em `px` fixo que impeça zoom; não bloquear `user-scalable`).
- Testar com TalkBack (Android) no fluxo: criar → enviar → ver status.

---

## 6. Plano de execução (por fases)

**Fase 1 — base (1–2 dias):** tokens (`--radius-sheet`, `--ease-exit`, `--ease-spring`), cards sem borda com `shadow-card`, press scale global, `tabular-nums`, ícones SVG no `Stat`, pill com ícone, `loading.tsx` com skeletons, toast.

**Fase 2 — navegação e fluxo principal (2–3 dias):** nav com indicador deslizante, cabeçalho que encolhe, FAB, barra de total única no formulário, rascunho automático, desfazer ao remover item, envio com ✓.

**Fase 3 — app de verdade (3–4 dias):** `<ViewTransition>` lista → detalhe, linha do tempo, bottom sheets, "Precisa de você", upload otimista com compressão, swipe nos itens, checklist da página.

---

## 7. Critérios de aceite

- [ ] Nenhum card do painel usa `border` como elevação; todos com `shadow-card`.
- [ ] Todo elemento tocável tem press feedback e alvo ≥ 48px.
- [ ] Nunca há duas barras fixas empilhadas na parte de baixo.
- [ ] Toda navegação mostra skeleton em < 100ms (testar com "Fast 4G" + CPU 4× no DevTools).
- [ ] Toda ação de salvar/excluir termina com toast; excluir tem "Desfazer".
- [ ] Nenhuma animação passa de 400ms; nenhuma roda em loop fora de skeleton.
- [ ] Com "reduzir movimento" ligado, todo o fluxo funciona e todo feedback continua visível.
- [ ] Uma única ação dourada por tela.
- [ ] Lighthouse mobile no `/painel`: Performance ≥ 90, Acessibilidade ≥ 95.
- [ ] INP < 200ms ao adicionar item no formulário (Chrome DevTools > Performance).
- [ ] Testado em um Android de entrada (ex.: Galaxy A10/A12 ou Moto E) e um iPhone.

---

## 8. O que preciso que você providencie

Coisas que eu não consigo gerar com qualidade (ou que precisam ser reais/legais). Quanto antes, melhor:

1. **Fotos reais de prestadores usando o app** — 3 a 5 pessoas de ramos diferentes (pintor, eletricista, marceneiro, mecânico), celular na mão, no local de trabalho, luz natural. Horizontal 4:3 e vertical 4:5, mínimo 2000px. **Com termo de uso de imagem assinado.** (Hoje a home usa uma imagem gerada em `public/demo/prestador-celular.webp` — trocar pela real.)
2. **Fotos reais de trabalhos** para a loja de exemplo (`pintura-norte`) — 8 a 12 fotos de antes/depois de um prestador parceiro, com autorização. Substituem as de `public/demo/trabalho-*.webp`.
3. **Um prestador parceiro de verdade** que aceite ser a "loja de exemplo" pública (nome, logo, serviços, preços médios). Converte muito mais que uma loja inventada.
4. **2 ou 3 depoimentos reais** com nome, ramo, cidade e foto (autorizados) — para a home e para o estado vazio do painel.
5. **Logo em SVG exportado do Corel** (versão horizontal, só o símbolo, e versão branca para fundo escuro) — o SVG atual foi traçado a partir do PNG.
6. **Ícone do app** no símbolo do Orçah: 1024×1024 PNG sem transparência (base), mais uma versão "maskable" com o símbolo dentro de 80% da área central. Eu gero os tamanhos 192/512/180 a partir dela.
7. **Splash / tela de abertura** do PWA: fundo `#151F38` com o símbolo centralizado (pode ser o mesmo arquivo do ícone).
8. **Ilustrações para estados vazios** (4): sem orçamentos, sem pedidos, sem clientes, sem fotos. Estilo traço simples em `ink` com um detalhe `gold`. Pode ser um pacote pago (ex.: Streamline, unDraw recolorido) — me mande o link/arquivos.
9. **Conjunto de ícones** definitivo: sugiro **Phosphor** ou **Lucide** (gratuitos, com versão preenchida para aba ativa). Me diga qual prefere e eu padronizo tudo.
10. **Aparelhos para teste**: um Android de entrada e um iPhone (pode ser emprestado) + 15 minutos de um prestador real usando o fluxo "criar → enviar" enquanto você observa sem ajudar. Anote onde ele travou.
11. **Textos legais**: termos de uso, política de privacidade e CNPJ (o rodapé da home ainda diz que entram no lançamento).
12. **Decisão sua:** o FAB "Criar orçamento" fica à direita (padrão Android) ou centralizado na nav (padrão iFood/Instagram)? Minha recomendação: à direita, acima da nav.
