# Vitrine profissional do prestador

Implementação e validação em 09/10/2026. Sem commit/push, dependências novas, alteração de schema ou mudança da API.

## Experiência implementada

- Estrutura: identidade → trabalhos (se houver) → serviços (se houver) → contato/sobre → assinatura Orçah.
- Hero integrado: logo de 84px no desktop e 62px no mobile, texto curto e ações lado a lado. Descrições longas ficam acessíveis em “Sobre”, no contato.
- Botões dourados e secundários reutilizam `home-buttons.module.css`, o mesmo módulo utilizado por `/painel/pagina`. WhatsApp mantém o verde com acabamento compatível.
- Navegação discreta no desktop, sem orçamento; nenhuma navegação no mobile.
- Cards de serviço menores, com CTA secundário e seleção do serviço ao abrir o orçamento.
- Contato sem card externo, mostrando apenas canais cadastrados.
- Orçamento em um único diálogo nativo: modal centralizado a partir de 768px e drawer inferior abaixo disso. A página normal não monta o formulário.
- Primeira etapa: nome, WhatsApp, descrição; serviço selecionado apresentado como resumo. Serviço editável, estado, cidade, bairro e horário ficam em “Adicionar mais detalhes”.
- Diálogo com nome acessível, fundo inerte, contenção de Tab/Shift+Tab, Escape, botão fechar, bloqueio de scroll e retorno do foco. Foco inicial no botão fechar evita abrir automaticamente o teclado no celular.
- CTA sticky somente no mobile, depois que o hero sai da viewport. Respeita safe area e reserva sua altura no conteúdo. Desaparece durante o orçamento, mantendo a reserva para não deslocar o fundo.
- Galeria compacta: 4/3 colunas no desktop; scroll horizontal com snap no mobile. Ampliação existente preservada; componente mantém seu layout anterior para outros consumidores.
- Painel: removido “Ainda sem avaliações”; mantidos preview clicável, modais, edição centralizada, progresso, serviços, fotos e configuração assistida. Não foram criados cards de contato/perfil/atendimento.

## Preservação

Subdomínios, proxy, slug, consulta pública, SEO, PageViewTracker, métricas de orçamento/WhatsApp/Instagram, filtros de fotos e serviços ativos, autorização para exibir preço e fallbacks por ramo/logo foram mantidos.

Abrir um orçamento atualiza `?servico=...#pedir` via History API, preservando o estado de navegação do Next e os demais parâmetros da URL, sem reload. Query de serviço e links antigos com `#pedir` continuam abrindo o diálogo após hidratação. Ao fechar, os parâmetros do orçamento são removidos.

Envio continua em `POST /api/publico/empresas/[slug]/pedir`. Campos opcionais e associação de estado/cidade permanecem no contrato. Nenhum dado real foi criado/modificado durante a validação.

## Arquivos

Alterados:

- `src/app/empresa/[slug]/page.tsx`: mantém carregamento/SEO e delega composição à vitrine.
- `src/app/globals.css`: layout compacto, galeria, diálogo, drawer, sticky e safe area.
- `src/components/quote-request-form.tsx`: primeira etapa curta e detalhes opcionais; compatibilidade com uso inline no diretório.
- `src/components/company-gallery.tsx`: variante compacta opcional.
- `src/components/page-tracking.tsx`: exportação da função existente para ações de orçamento.
- `src/app/painel/pagina/page.tsx` e `page.module.css`: remoção das avaliações vazias e pequeno ajuste do espaço do preview mobile.

Adicionados:

- `src/components/provider-showcase.tsx`: composição da vitrine, reutilizável e testável sem banco.
- `src/components/provider-quote-experience.tsx`: único controlador de modal/drawer, botões, deep links e sticky.
- `src/lib/quote-request.ts`: payload, transporte e URLs de orçamento.
- `tests/provider-showcase.test.ts`: 10 testes novos.
- Este relatório e `docs/prestador-vitrine/`: capturas e matriz de verificação responsiva.

## Validação

- `npm run typecheck`: passou.
- ESLint em todos os arquivos TypeScript alterados/adicionados: passou.
- `git diff --check`: passou.
- 70 testes passaram: vitrine, página pública/editor, serviços, métricas, contexto de pedidos, ciclo de orçamento, capas, fallback por ramo, cidades e WhatsApp.
- Testes novos verificam formulário sob demanda, diálogo único, serviço selecionado, conteúdo ausente, preço oculto, textos escapados, etapa curta, compatibilidade de URL, payload/envio/sucesso/erros e tipos de tracking.
- Navegador com Pintada nas larguras 375, 390, 430, 768, 1024 e 1440px: nenhum overflow horizontal da página ou do diálogo; formulário único ao abrir, inexistente quando fechado. Medições em `responsividade.json`.
- Conferidos Escape, Tab/Shift+Tab, restauração de foco para hero/serviço/sticky, hash/query após reload, integração estado/cidade, campos obrigatórios e sticky escondido ao abrir o drawer.
- Conferida a estabilidade do scroll ao abrir o drawer pelo sticky: mesma posição (355px) e mesma altura de página (1055px) antes/depois.
- Capturas desktop anteriores e atuais têm a mesma largura (1425px de conteúdo): altura de 1863px para 1112px, redução de aproximadamente 40% na Pintada.
- Painel conferido no navegador: negócio, atendimento e contato seguem juntos em Editar informações; texto de avaliações ausentes removido.
- Pintura Norte, já existente no banco, também conferida sem capa, logo, serviços e fotos: fallbacks legíveis e sem seções vazias. Nenhum cadastro de teste foi criado.

## Limites e decisões de produto

Pintada e Pintura Norte estão sem fotos de galeria. A presença/ordem da galeria foi coberta por renderização automatizada e sua variante CSS foi implementada; ampliação e scroll-snap com fotos reais ainda precisam ser conferidos quando houver fotos cadastradas.

Transporte de envio foi testado com respostas controladas de sucesso, erro e falha de conexão. Não foi enviado um pedido válido ao banco real, para não criar dados fictícios. Validação obrigatória e seleção de cidade foram exercitadas no navegador.

Não há decisão de produto bloqueando esta entrega. Estado/cidade/bairro/horário continuam opcionais e acessíveis; nenhuma nova regra de obrigatoriedade foi introduzida. Não há gesto de arrastar o drawer para fechar; o fechamento é pelo botão ou Escape.
