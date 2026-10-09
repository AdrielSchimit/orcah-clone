# Página do prestador — estado anterior ao redesign

Registro em 09/10/2026. Escopo: avaliar e armazenar a estrutura existente; a interface e os dados não foram alterados.

## Referências e evidências

- Página pública: http://pintada.localhost:3000/
- Editor: http://localhost:3000/painel/pagina
- Home: http://localhost:3000/
- Capturas em `docs/prestador-baseline/`: `publica-atual.jpg`, `publica-topo.jpg`, `editor-atual.jpg`, `home-atual.jpg`.
- Sessão existente permitiu abrir o editor da Pintada. Não foi necessário inserir credenciais. Nenhuma senha foi armazenada.
- A captura pública foi observada em viewport de aproximadamente 690px. Uma tentativa de configurar 390px não foi aplicada pelo navegador; `publica-mobile.jpg` repete a largura observada e não comprova um teste em celular. Validar 390px/desktop no redesign.

## Conteúdo da conta de referência

Pintada, ramo Pintor, Maravilha - SC. Descrição: “Melhor Pintada da Cidade”. Capa e logo personalizadas. Um serviço ativo: Pintura Interna, “acabamento com massa fina e 3 demãos”, R$ 30,00/m², preço visível. WhatsApp, telefone e Instagram presentes. Sem fotos na galeria; a seção Trabalhos não aparece. Editor indica 86% de preenchimento e recomenda adicionar pelo menos três fotos.

## Estrutura pública atual, na ordem

1. Capa de largura total, separada da identidade. Imagem com `object-contain`, 192px de altura ou 256px a partir de `sm`; na ausência de capa, ilustração do ramo.
2. Identidade: fundo da cor principal, logo quadrada com cantos arredondados, nome, ramo/localidade, descrição e ações Pedir orçamento/WhatsApp. Na referência, fundo preto e grande espaço vertical entre capa e ações.
3. Serviços: cards com foto opcional, nome, destaque opcional, categoria, descrição, preço opcional/unidade e pedido de orçamento. Grade de uma coluna, duas a partir de `sm`.
4. Trabalhos: condicional à existência de fotos. Grade de duas colunas, três a partir de `sm`, com ampliação de imagem. Ausente na Pintada.
5. Contato: área atendida, horário opcional, WhatsApp, ligar e redes/site quando preenchidos.
6. Formulário: nome e WhatsApp obrigatórios; serviço com sugestões, descrição, estado opcional, cidade habilitada após estado, bairro e melhor horário. Botão Solicitar orçamento; estados de envio, erro e sucesso.
7. Assinatura: logo e “Página feita com Orçah”, com link para a home.

Conteúdo principal limitado a `max-w-3xl` (48rem). Não há navegação de seções/abas nem avaliações reais nessa página.

## Comportamentos e limites da avaliação

- Verificado no navegador: pedir orçamento no card navega para `?servico=Pintura%20Interna#pedir` e preenche o campo Serviço desejado.
- Links WhatsApp contêm uma mensagem com o nome do prestador. Destinos externos não foram acionados.
- Nenhum pedido foi enviado, serviço modificado ou foto adicionada. Envio, persistência, estados de erro e galeria não foram testados de ponta a ponta.
- O formulário usa `POST /api/publico/empresas/[slug]/pedir`. Rastreamento usa os componentes PageViewTracker/TrackedLink.
- O host `nomeprestador.localhost:3000/` é resolvido pelo proxy para `/empresa/[slug]`. URLs são centralizadas em `src/lib/urls.ts`; manter essa abstração ao trocar o domínio.
- Consulta pública seleciona campos específicos, apenas serviços/fotos ativos, e só retorna preço quando autorizado pelo prestador. Preservar essas regras.

## Comparação com o design do projeto

O editor já apresenta capa, logo, nome e informações em um card integrado, com imagem de fundo e sobreposição para leitura. Usa superfícies claras, bordas suaves, cards arredondados e sombras discretas. A home utiliza a mesma família visual e apresenta uma demonstração da página com Trabalhos/Serviços/Pedir orçamento em abas.

A página pública conserva o layout anterior: capa isolada, bloco de identidade alto e sequência linear de cards. Os tokens globais são compartilhados, mas a composição difere bastante das referências.

Há ainda uma diferença de tema: `.public-company-page` declara `color-scheme: light dark` e possui overrides em `prefers-color-scheme: dark` em `globals.css`. Na sessão observada, o conteúdo público ficou escuro, enquanto o editor ficou claro. O fundo preto da identidade também depende da cor principal do prestador, independentemente desse tema automático.

## Direção recomendada para a próxima etapa

1. Integrar capa e identidade em um topo mais compacto, usando o editor como referência e mantendo boa leitura com qualquer imagem/cor do prestador.
2. Harmonizar superfícies, tipografia, cantos, bordas e espaçamentos com home/editor; definir explicitamente o comportamento do tema público.
3. Dar mais visibilidade aos trabalhos quando houver fotos. Avaliar navegação Trabalhos/Serviços/Pedir orçamento conforme a demonstração da home, sem adicionar estrelas ou avaliações fictícias.
4. Manter ações de orçamento e WhatsApp claras, com cards consistentes e formulário mais fácil de percorrer, incluindo rótulos visíveis.
5. Validar composição em 390px e desktop, casos sem capa/logo/fotos, muitos serviços e nomes/descrições longos.

Esses itens são recomendações registradas, ainda não implementadas.

## Mapa de implementação

- `src/app/empresa/[slug]/page.tsx`: página pública e metadados.
- `src/lib/public-page.ts`: contrato público, filtros e cores.
- `src/components/quote-request-form.tsx`: formulário.
- `src/components/company-gallery.tsx`: galeria pública.
- `src/components/page-tracking.tsx`: métricas de navegação.
- `src/app/globals.css`: tokens e overrides do tema público.
- `src/app/painel/pagina/page.tsx` e `page.module.css`: referência atual do editor.
- `src/components/home/`: componentes visuais da home.
- `src/proxy.ts` e `src/lib/urls.ts`: subdomínios e rotas.

A documentação antiga `docs/PAGINA_COMERCIAL.md` menciona editor em sanfonas; o editor observado atualmente usa identidade visual e modais. Para os próximos ajustes, priorizar o código e as capturas deste registro. Antes de implementar código Next.js, ler o guia pertinente em `node_modules/next/dist/docs/`, conforme AGENTS.md.
