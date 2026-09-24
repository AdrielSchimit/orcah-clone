### 01 - Mapeamento de Estrutura para Economia de Contexto

**Objetivo:** Usar o Grok no Agent Mode para escanear o projeto e descobrir exatamente quais arquivos controlam a interface, para que possamos enviar apenas eles para o Claude Opus no modo Chat. 

### 🛠️ Instrução para o Agent Mode (Grok 4.7)

"Grok, analise a estrutura de pastas deste projeto Next.js. Identifique e liste abaixo quais são os arquivos exatos que controlam o layout, as páginas principais de criação/visualização de orçamentos, os componentes globais (como Sidebar, Navbar, Botões) e os arquivos de configuração de estilo (ex: tailwind.config.js, globals.css). 

Escreva a resposta atualizando este próprio arquivo markdown na seção 'Arquivos Identificados'." 

### 📂 Arquivos Identificados (Para o Grok Preencher)

App Router em `src/app`. Não existe `tailwind.config.js`: o tema Tailwind v4 está em `src/app/globals.css` (`@import "tailwindcss"` + `@theme`). Não existe um componente compartilhado de botão; botões são elementos locais com classes utilitárias.

#### Layout

* [x] `src/app/layout.tsx` — layout raiz (fontes Geist, metadata, `globals.css`, registro PWA)
* [x] `src/app/painel/layout.tsx` — shell do painel: header, logo, banner do plano e área com a navegação

#### Páginas de orçamento (criar / listar / ver)

* [x] `src/app/painel/page.tsx` — lista e resumo dos orçamentos no painel
* [x] `src/app/painel/orcamentos/novo/page.tsx` — criação de orçamento
* [x] `src/app/painel/orcamentos/[id]/page.tsx` — visualização e edição no painel
* [x] `src/app/orcamento/[token]/page.tsx` — visualização pública do orçamento (link do cliente)

#### Componentes dessas páginas

* [x] `src/components/budget-form.tsx` — formulário de criar/editar orçamento
* [x] `src/components/budget-photos-form.tsx` — fotos do orçamento
* [x] `src/components/create-budget-cta.tsx` — atalho para criar orçamento
* [x] `src/components/public-budget-actions.tsx` — ações do cliente na página pública
* [x] `src/components/status-pill.tsx` — status do orçamento

#### Componentes globais (nav, marca, botões)

* [x] `src/components/painel-nav.tsx` — navegação do painel (barra inferior no mobile, sidebar fixa no desktop)
* [x] `src/components/brand-bar.tsx` — header com a marca (páginas públicas/auth)
* [x] `src/components/orcah-mark.tsx` — logo Orçah
* [x] `src/components/copy-link-button.tsx` — botão de copiar link
* [x] `src/components/send-whatsapp-button.tsx` — botão de enviar no WhatsApp
* [x] `src/components/logout-button.tsx` — botão de sair
* [x] `src/components/activate-plan-button.tsx` — botão de ativar plano

#### Estilo

* [x] `src/app/globals.css` — tokens de cor, raio, fonte e estilos base
* [x] `postcss.config.mjs` — plugin `@tailwindcss/postcss`