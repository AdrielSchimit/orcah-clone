# Orçah — 02: melhorias precisas de design da home

Revisão de 05/10/2026, após inspeção visual da versão atual. Complementa `orcah-home-prestadores.md`; em caso de conflito de estilo ou menu, esta revisão prevalece. A estrutura funcional anterior permanece: barra compacta abaixo do cabeçalho, hero comercial e dois cards integrados ao hero, com destinos para `/prestadores` e login/painel. Não alterar o projeto nesta etapa documental.

## 1. Diagnóstico observado

A versão local foi observada em desktop 1440 × 1000 e parcialmente em viewport mobile 390 × 844, além de leitura dos componentes atuais.

- No desktop, o header mostra apenas Encontrar profissionais e Área do prestador na navegação principal. Como funciona, Sua página, Orçamentos, Plano e Perguntas foram movidos para um dropdown Menu. O usuário exige esses textos visíveis novamente no desktop.
- A barra é um input quase da largura inteira com botão solto ao lado, sem composição visual própria. Ela deve continuar pequena, mas parecer um componente acabado.
- Os dois cards são caixas brancas grandes, com ícone, título e links pequenos. As descrições têm alturas diferentes e os CTAs não compartilham a mesma linha de base.
- Há um intervalo visual excessivo entre cards e a seção de profissões, causado pela soma do padding inferior do hero e superior da seção seguinte.

Esta revisão não reprojetará o hero inteiro, nem recolocará o bloco grande riscado pelo usuário. O objetivo é refinar navegação, busca e cards existentes com medidas concretas.

## 2. Cabeçalho: recuperar menu completo e destacar os dois destinos

### Desktop a partir de 1024 px: duas linhas organizadas

Usar duas linhas deliberadas, em vez de tentar encaixar logo, sete destinos e autenticação na largura de 1024 px.

**Linha superior — identidade e ações (64 px de altura):**

- Container `max-w-6xl`, centralizado, padding horizontal 24 px.
- Logo à esquerda, preservar proporções.
- À direita, um grupo dos dois acessos principais: Encontrar profissionais e Área do prestador/Acessar painel. Gap 8 px. Cada acesso tem ícone de 16–18 px, texto 14 px sem quebra, peso 600 e altura 40 px.
- Encontrar profissionais: fundo `gold-wash`, texto `gold-deep`, borda sutil do tom dourado.
- Área do prestador: fundo `brand-wash`, texto `ink`, borda `line`. Sessão válida mantém o destino de painel.
- Após esse grupo, separador vertical discreto e ações de conta existentes. Entrar simples e Começar grátis em botão dourado de 40 px. Gap 12 px. Não duplicar dois botões Acessar painel quando autenticado: o acesso destacado ao painel já atende essa ação.

**Linha inferior — navegação de produto (40 px de altura):**

- Mostrar explicitamente: **Como funciona · Sua página · Orçamentos · Plano · Perguntas**.
- Reutilizar `nav` e suas âncoras atuais, sem novas rotas.
- Alinhar ao container; gap 24 px, fonte 14 px, peso 500, cor `text-soft`, hover `text`.
- Borda superior de 1 px em `line` com baixa intensidade; fundo `card`.
- Nenhum botão Menu no desktop. Os links normais não podem ficar ocultos em um dropdown a 1024, 1280 ou 1440 px.

Header completo sticky, fundo `card/95`, backdrop blur discreto e borda inferior sutil. Altura nominal desktop 104 px; atualizar offsets de âncora para altura real mais 16 px, sem manter `scroll-mt-[4.5rem]` se ele ficar insuficiente.

### Mobile e tablet abaixo de 1024 px

Uma linha de 64 px com logo, Menu e Entrar/painel. O menu expandido contém primeiro os dois acessos destacados, depois separador e os cinco links normais. Não retirar nenhum destino. Os dois acessos também continuam nos cards da home.

Manter tap targets de pelo menos 44 px. Menu aberto não deve ultrapassar a viewport a 360 px; fechar ao selecionar uma âncora para não continuar cobrindo a seção.

## 3. Barra de busca: compacta, com acabamento

Não adicionar título grande, parágrafo, cidade ou geolocalização na home.

- Faixa abaixo do header: fundo `paper`, padding vertical 12 px e horizontal 16 px no mobile/24 px no desktop. Borda inferior sutil.
- Container alinhado ao corpo `max-w-5xl`.
- Um único invólucro branco para input e botão: borda 1 px `line`, raio 14 px, altura 52 px no desktop e 48 px no mobile. Sombra muito leve, por exemplo `0 2px 8px rgba(15,23,42,.04)`.
- Lupa decorativa de 18 px no lado esquerdo, cor `text-soft`, margem esquerda 16 px.
- Input flexível, `min-width:0`, sem borda/fundo/sombra próprios, fonte 15–16 px; placeholder “Pesquise profissionais…”. Padding horizontal 12 px. Rótulo acessível mantido.
- Botão Buscar dentro do mesmo invólucro, margem 5 px, altura 40 px desktop/36 px mobile, raio 10 px, padding horizontal 18 px desktop/14 px mobile, fundo `gold`, texto `ink` peso 600. Não repetir lupa dentro do botão se ela já estiver no campo.
- Focus-within no invólucro: borda `gold-deep` e anel externo sutil de 3 px em dourado translúcido. Foco específico do botão continua perceptível por teclado.
- A faixa inteira deve ter cerca de 76 px desktop/72 px mobile. Não aumentar padding para transformá-la novamente em seção.

Preservar Enter e navegação existentes: vazio → `/prestadores`; texto → mesma rota com `servico` e `ordenar=relevancia`. Cidade é completada na página dedicada. Nenhuma nova chamada de API ou regra de validação é necessária.

## 4. Cards: duas escolhas claras, com hierarquia e CTAs fortes

Continuam dentro de `#hero-comercial`, abaixo da composição de texto/foto. Não colocá-los na faixa de busca, acima do hero ou numa nova grande seção separada.

### Grid e ritmo

- Container `max-w-5xl`, grid de duas colunas a partir de 768 px, uma abaixo disso.
- Gap 20 px desktop/12 px mobile.
- Distância da composição comercial aos cards: 40 px desktop/28 px mobile. Reduzir o atual `md:mt-16`.
- Padding de card 24 px desktop/20 px mobile; raio 20 px; borda 1 px; sombra leve `0 4px 16px rgba(15,23,42,.05)`.
- Alturas iguais no desktop pelo grid e flex, sem uma altura fixa que corte textos. Não usar grandes min-heights para criar espaço vazio.

### Composição interna

1. Linha superior com ícone de 24 px dentro de uma caixa de 48 × 48 px, raio 14 px, e pequeno rótulo ao lado: “PARA CONTRATAR” ou “PARA PRESTADORES”. Rótulo 11 px, peso 600, tracking moderado.
2. Título 22 px desktop/20 px mobile, peso 600, line-height 1.25, margem superior 16 px.
3. Descrição 14 px, line-height 1.5, margem superior 8 px, largura legível.
4. Área de ação ancorada ao final por `margin-top:auto`, com padding-top 20 px. No desktop, reservar a mesma altura de duas linhas de descrição em ambos os cards para alinhar CTAs, mantendo flex e espaço para crescimento de texto. No mobile, altura natural.

**Card Encontrar profissionais:** fundo `card`, borda dourada discreta; caixa de ícone `gold-wash`. Descrição: “Encontre quem atende sua cidade e conheça seus trabalhos.” CTA principal “Pesquisar prestadores” com seta, botão dourado de altura 44 px, largura total, destino `/prestadores`.

**Card Área do prestador:** fundo `card`, borda `line`; caixa de ícone `brand-wash`. Descrição: “Organize sua página, clientes e orçamentos em um só lugar.” CTA principal “Entrar na área do prestador” ou “Acessar painel”, botão `ink` com texto branco e seta, altura 44 px, largura total, destino via `appUrl` e sessão existente.

Para visitantes, “Começar grátis” fica como link secundário discreto no canto superior direito desse card, na linha do rótulo, com alvo de toque adequado. Assim não cria uma linha adicional abaixo de um dos botões e os dois CTAs principais permanecem alinhados. A 360 px, se essa linha não comportar tudo, deixar o link junto do rótulo em quebra natural; nunca sobrepor ícone ou título.

Não tornar todo o card um link se ele contiver cadastro e login. Usar link estilizado como botão para cada destino, sem elementos interativos aninhados.

### Interação

Hover: borda mais definida e sombra moderada; transição de 150–180 ms. Opcional deslocamento de até 2 px, desabilitado com prefers-reduced-motion. Não adicionar animação contínua, brilho, gradiente forte ou ilustração fictícia.

Focus-visible nos links: anel 2 px com offset 3 px e contraste claro. Os estados base devem comunicar a ação sem depender de hover.

## 5. Ritmo entre hero, cards e profissões

Atualmente a soma de `md:pb-24` no hero com `md:py-24` em `#oficios` cria aproximadamente 192 px antes do próximo título. Corrigir esse encontro:

- Hero após os cards: padding-bottom 32 px desktop/24 px mobile.
- `#oficios`: padding-top 32 px desktop/24 px mobile; preservar padding inferior e demais conteúdos salvo ajuste estritamente necessário.
- Resultado: 64 px desktop/48 px mobile entre o final dos cards e o título seguinte.

Não alterar copy comercial, imagens, demonstrações, plano, FAQ ou dados do produto para melhorar o acabamento desses componentes.

## 6. Arquivos e limites

- `src/app/page.tsx`: header de duas linhas no desktop, restauração de `nav` visível, destaque dos dois acessos, composição/estilos dos cards e ritmo com `#oficios`.
- `src/components/home/home-provider-search.tsx`: invólucro integrado de busca, ícone, foco e botão. Preservar navegação.
- `src/components/home/home-mobile-sticky-cta.tsx`: somente se novos espaçamentos exigirem corrigir gatilho; nunca cobrir cards ou barra.

Reutilizar tokens de cor, fonte e componentes existentes. Valores numéricos acima são referências concretas; preservar os tokens equivalentes do projeto quando houver. Não alterar cores globais para estilizar apenas esses elementos.

Preservar `viewerIsLoggedIn()`, `appUrl`, `companyPublicUrl`, `TRIAL_DAYS`, `PLAN_PRICE_LABEL`, `/prestadores`, filtros, perfis, pedido público, banco, contas e APIs. Nenhuma migração ou seed. Ler `AGENTS.md` e guias locais exigidos antes de escrever código.

## 7. Aceite visual e validação

- A 1440, 1280 e 1024 px: cinco links de seções visíveis; dois acessos principais destacados; nenhum texto do menu quebra de forma espremida; nenhum overflow; nenhuma duplicação de painel autenticado.
- A 390 e 360 px: menu contém todos os destinos; busca continua em uma linha; cards empilhados e sem cortes; nenhum elemento excede a largura útil.
- Barra apresenta um único controle integrado, sem botão solto ou input com borda duplicada.
- CTAs dos cards têm mesma altura e alinhamento no desktop; os cards parecem opções de navegação, não caixas informativas com links pequenos perdidos.
- O intervalo cards/profissões corresponde ao ritmo descrito; o bloco grande removido não retorna.
- Âncoras ficam abaixo do header completo; foco de teclado é visível; reduced motion é respeitado.
- Busca, cards e login/cadastro mantêm destinos existentes.

Executar typecheck e lint dos arquivos alterados. Conferir screenshots de topo e cards separadamente nas larguras acima; conferir menu mobile aberto e navegação por teclado. Não declarar envio, autenticação ou dispositivo físico testados se não foram exercitados. Não enviar pedidos reais.

Nesta revisão documental não foram executados testes de código, login, envio, build ou acessibilidade completa. A avaliação mobile foi parcial; os critérios de 360/390 px precisam ser cumpridos pelo implementador após a alteração.
