# Orçah — Correção da home: barra compacta e cards integrados

Direção final do usuário em 05/10/2026. Projeto: `C:\Users\cesar\Desktop\orcah-clone`.

**Este documento substitui integralmente as orientações anteriores de layout. Não reconstruir o bloco grande de busca nem colocar os dois cards em outra seção grande acima do hero.** Nesta etapa foi atualizado somente este Markdown; o código deve ser corrigido pelo Cursor.

## 1. Mudança pedida, com referência à imagem

O usuário marcou para remoção TODO o bloco entre o cabeçalho e o hero comercial. Esse bloco contém:

- título grande “Encontre o profissional para o serviço que você precisa.”;
- descrição “Informe o serviço e a cidade...”;
- card lateral “Você presta serviços?” com vários links;
- formulário grande com serviço, cidade, localização e Buscar profissionais;
- padding, altura e composição de seção que envolvem esses elementos.

Remover essa composição da home. A substituição é **somente uma barra de busca compacta abaixo do menu**, com texto como “Pesquise profissionais”. Não manter o mesmo bloco e apenas mudar sua copy ou trocar a posição do card.

Os **dois cards de escolha** devem estar no bloco seguinte da própria home, integrados ao hero/conteúdo comercial existente. Não pertencem à faixa de busca superior. Não são cards de resultados de profissionais.

## 2. Estrutura obrigatória

```text
CABEÇALHO / MENU
──────────────────────────────────────────
BARRA COMPACTA: [ Pesquise profissionais… ] [ Buscar → ]
──────────────────────────────────────────
BLOCO PRINCIPAL DA HOME / HERO COMERCIAL
  Texto comercial existente e foto/demonstração
  Dois cards integrados ao mesmo bloco:
    [ Encontrar profissionais ] [ Área do prestador ]
──────────────────────────────────────────
Demais seções atuais, plano, FAQ e rodapé
```

A barra é uma faixa curta. O bloco seguinte continua tendo a identidade da home atual, com “Orçamento bonito no WhatsApp. Cliente aprova com um toque.” e sua imagem. Os cards fazem parte desse bloco, em uma linha de largura total abaixo da composição de texto/foto. No mobile, vêm após a apresentação do hero e ficam empilhados.

Não criar entre a barra e o hero uma nova seção de introdução, escolha ou formulário. O visitante deve ver rapidamente o conteúdo da home abaixo da faixa compacta.

## 3. Barra de busca superior

- Imediatamente abaixo do cabeçalho sticky.
- Um único campo de pesquisa com placeholder **“Pesquise profissionais…”** e ação **“Buscar”**, podendo usar ícone de lupa.
- Rótulo acessível “Pesquise profissionais”; não usar um H1/H2 grande como introdução.
- Não mostrar campo de cidade, botão de geolocalização ou card do prestador nessa faixa. A cidade será informada na página `/prestadores`.
- Desktop: campo e botão em uma linha, alinhados à largura da home (`max-w-5xl`), altura de controle aproximada de 44–48 px e padding vertical curto (12–16 px). Não envolver em outro grande card com sombra e padding de seção.
- Mobile: manter uma linha compacta com campo flexível e botão curto, padding lateral de 16 px e sem overflow a 360 px. O placeholder pode encurtar naturalmente conforme a largura.
- Enter e clique acionam a mesma navegação.

### Destino e critérios

A barra é um atalho para a busca dedicada, não uma listagem dentro da home:

- Com texto, navegar para `/prestadores?servico=<texto-codificado>&ordenar=relevancia`.
- Sem texto, navegar para `/prestadores`, permitindo começar a pesquisa lá.
- Não exigir cidade na home nem emitir o erro antigo “Informe o serviço e a localização para buscar”.
- Não buscar resultados na home. `/prestadores` continua exigindo serviço e localização para executar sua pesquisa de resultados.

Reutilizar `HomeProviderSearch` como componente client, mas substituir sua composição atual de `SearchBar` completo por este campo compacto. Não modificar o `SearchBar` compartilhado de `/prestadores` para fazê-lo caber na home.

**Integração necessária:** em `/prestadores`, garantir que o serviço recebido pela URL apareça preenchido enquanto a cidade está vazia. O usuário deve completar a cidade ali e continuar normalmente. Conferir apenas esse caso de chegada; não reformular a página, APIs ou regras. Preservar os parâmetros existentes `servico`, `cidade`, `local`, `tipo`, `ordenar` e `perfil` e o comportamento de busca completa atual.

## 4. Dois cards no bloco abaixo, integrados à home

Adicionar os dois cards dentro de `#hero-comercial`, abaixo da composição comercial de texto e foto, com o mesmo container e identidade visual. Eles precisam parecer parte da home, sem outra faixa grande isolada.

| Card | Descrição curta | Ação principal |
| --- | --- | --- |
| **Encontrar profissionais** | “Conheça prestadores, veja seus trabalhos e pesquise por serviço e cidade.” | **Pesquisar prestadores →**, link direto para `/prestadores`. |
| **Área do prestador** | “Gerencie sua página, seus clientes e seus orçamentos.” | Visitante: **Entrar →**, `appUrl('/login')`; sessão válida: **Acessar painel →**, `appUrl('/painel')`. |

Para visitantes, pode existir link secundário **Começar grátis** no card do prestador, com `appUrl('/cadastro')`. Evitar vários botões grandes empilhados e não repetir “Conhecer o Orçah” dentro do hero, onde a pessoa já está conhecendo o produto.

### Aparência exigida

- Dois cards com o mesmo peso visual, largura equivalente e alturas alinhadas no desktop.
- Ícones de busca e painel, títulos claros, descrição curta e CTA com seta.
- Fundo, borda sutil, sombra discreta, cantos e cores coerentes com o Orçah; dourado e tinta podem diferenciar os detalhes.
- Padding aproximado de 24 px e gap de 16–24 px no desktop.
- Mobile: dois cards empilhados, padding de aproximadamente 20 px, sem tornar cada um excessivamente alto.
- Hover e foco visíveis; links semânticos, sem links aninhados.

Os cards devem existir mesmo com os mesmos destinos no menu. A função deles é oferecer duas opções visuais na home.

## 5. Cabeçalho, conteúdo comercial e CTA mobile

Manter os acessos textuais do topo: **Encontrar profissionais** → `/prestadores` e **Área do prestador** → login/painel conforme sessão. O primeiro abre a página dedicada, não apenas uma âncora na home.

Corrigir a navegação apertada da versão observada. Não aceitar Como funciona, Sua página ou Começar grátis espremidos em duas linhas no desktop. Usar o menu para os links secundários quando não houver espaço. Mobile mantém logo, Menu e acesso de conta compactos.

Preservar o hero, foto e demonstrações, seções de página profissional, orçamentos, funcionamento, profissões, plano, FAQ e rodapé. Manter `id="hero-comercial"` e offsets de âncora adequados ao header sticky.

Preservar `viewerIsLoggedIn()`, `SESSION_COOKIE`, `readSessionToken`, `appUrl(...)`, `companyPublicUrl(DEMO_SLUG)`, `TRIAL_DAYS` e `PLAN_PRICE_LABEL`. Não criar regras novas de conta, permissão ou onboarding.

Se mantido, `HomeMobileStickyCta` deve aparecer somente após passar pela apresentação inicial e pelos dois cards, no conteúdo comercial subsequente. Não usar a saída da pequena barra de busca como gatilho: isso faria o CTA aparecer cedo demais. Reservar espaço e safe area e não cobrir conteúdo ou controles.

O modal inicial `HomeEntryModal` permanece removido. Não recriar escolha obrigatória, modal automático ou dependência de sessionStorage.

## 6. Arquivos e escopo

| Arquivo | Trabalho esperado |
| --- | --- |
| `src/app/page.tsx` | Eliminar o bloco marcado na imagem; inserir faixa compacta abaixo do menu; integrar os dois cards dentro do hero; ajustar navegação e espaçamentos. |
| `src/components/home/home-provider-search.tsx` | Trocar formulário completo por campo compacto e navegação descrita acima. |
| `src/components/home/home-mobile-sticky-cta.tsx` | Corrigir gatilho considerando a nova estrutura, se necessário. |
| `src/components/prestadores/prestadores-search-page.tsx` | Somente se necessário para preservar o serviço da URL na chegada sem cidade. |
| `src/components/prestadores/search-bar.tsx` | Preservar formulário completo da busca dedicada. |
| `src/lib/urls.ts`, `src/lib/plan-constants.ts`, `src/lib/session-token.ts` | Reutilizar sem reformular. |

Não recriar `/prestadores`, cards de resultados, perfil, skeleton, filtros ou `QuoteRequestForm` público. Não inserir login obrigatório para pedir orçamento. Preservar painel desktop `w-[min(80vw,56rem)]`, perfil mobile, retorno e parâmetros de URL.

Não alterar Prisma, banco, seeds, contas, APIs ou infraestrutura. `rating`/`reviewCount` continuam nulos; não inventar avaliações. Cobertura continua sendo cidade igual ou `servesRegion=true` no mesmo estado, sem raio ou lista nova de cidades.

Ler o `AGENTS.md` aplicável e os guias relevantes em `node_modules/next/dist/docs/` antes de escrever código, conforme a instrução local.

## 7. Critérios de aceite — avaliar visualmente

- O bloco inteiro riscado pelo usuário desapareceu: sem título grande de busca, sem descrição longa, sem card lateral e sem formulário serviço/cidade na home.
- Há apenas uma faixa compacta de busca imediatamente abaixo do menu.
- O hero comercial começa logo abaixo dessa faixa, sem uma seção grande intermediária.
- Os dois cards estão integrados ao hero/bloco da home, abaixo da apresentação comercial; não na barra superior.
- Card e link do topo Encontrar profissionais abrem `/prestadores` diretamente.
- Busca com texto abre `/prestadores` e mantém serviço preenchido; cidade é completada nessa página. Busca vazia abre a página sem erro.
- Cards do prestador respeitam login/painel/cadastro atuais.
- Desktop tem cards equivalentes e menu sem textos espremidos; mobile a 390 e 360 px mantém barra compacta e cards empilhados sem overflow.
- Conteúdo comercial, constantes, resultados, perfil e fluxo público de pedido continuam funcionando.

## 8. Evidências e verificações

A imagem enviada pelo usuário marca explicitamente o bloco a remover. A versão anterior foi conferida no navegador em desktop 1440 × 900 e mobile 390 × 844 e 360 × 800: havia um card pequeno de prestador acima do formulário; no mobile, separava título e campos; no desktop, os links do menu quebravam em duas linhas. O envio do formulário foi confirmado chegando a `/prestadores` com os critérios. A mudança agora pedida ainda não foi implementada nem validada visualmente.

A inspeção anterior confirmou resultados e perfil existentes com dados retornados pela aplicação local, sem criar massa de dados ou enviar pedidos. Não certifica dados de produção. Login, cadastro, sessão autenticada, geolocalização, envio e acessibilidade completa não foram testados. Mobile foi viewport de navegador, não aparelho físico. Typecheck e ESLint da primeira implementação foram relatados pelo implementador, não executados nesta revisão.

Após corrigir: executar typecheck e lint dos arquivos alterados; conferir visualmente desktop, 390 px e 360 px; testar clique dos dois cards, Enter na barra, busca vazia e com texto, chegada sem cidade e conclusão da busca em `/prestadores`. Conferir regressão básica de resultados/perfil sem enviar pedido real. Não executar migrations ou seeds para uma mudança de layout. Relatar somente verificações efetivamente executadas.
