# Polimento da vitrine — 14/10/2026

Base: commit `dac04180a2d7a3ef4379e41029abbe0ed5517170`, árvore inicialmente limpa. Analisados AGENTS.md, os componentes atuais, guias locais do Next e capturas de `docs/prestador-vitrine/`. Nenhum commit/push realizado.

## Composição

- Navbar interna e sua borda removidas por completo.
- Removidos os três subtítulos genéricos de trabalhos, serviços e contato.
- Hero preservado, com nome de 44px no desktop, logo de 88px e botões maiores. No mobile, nome de 29px, logo de 62px e CTAs compactos lado a lado. Overlay reforçado, inclusive à direita, para textos sobre capas claras.
- Nomes e descrições têm limites visuais. Descrições longas podem ser lidas no próprio hero por uma divulgação nativa discreta, com área de leitura limitada e acessível por teclado. Não existe uma seção Sobre artificial no final.
- Galeria adaptativa: foto única até 440px, duas fotos em duas colunas, três em três colunas, demais em três/quatro colunas conforme a tela. Imagens em 4:3, sem moldura. No mobile, uma foto ocupa a largura disponível; várias usam scroll-snap com a próxima parcialmente visível.
- Serviços: item único até 420px; dois em duas colunas; três ou mais usam três colunas onde há espaço. Bordas de 1px, sombra mínima e hover discreto. Preços e Destaque continuam condicionais.
- Quando existem exatamente uma foto e um serviço, as duas seções compartilham a largura no desktop a partir de 1024px. Ordem do DOM preservada: Trabalhos antes de Serviços; mobile/tablet continuam verticais. Isso evita o grande vazio à direita no caso atual da Pintada.
- Contato com localidade/horário e ações próximos, sem card externo nem botões no extremo oposto.
- Separação por espaços e títulos, sem novas caixas envolvendo seções. Assinatura Orçah discreta.

## Avaliações futuras

Nenhuma estrela, nota, contador, mensagem vazia ou seção Avaliações renderizada. Comentários de integração indicam o resumo após a localização no hero e a futura seção depois de Serviços/antes de Contato. A grade do caso de pouco conteúdo já faz as seções subsequentes ocuparem a largura inteira. Não foi criado componente vazio, contrato de dados fictícios, schema ou migration.

## Arquitetura preservada

ProviderQuoteExperience, formulário, tracking e página server/metadata não foram alterados. Permanecem modal, drawer, sticky, deep links, envio, detalhes opcionais, bloqueio de scroll, foco, safe area, subdomínios, proxy, slug, filtros públicos e preços autorizados. Ampliação da galeria também preservada.

O editor `/painel/pagina` não recebeu mudanças. A ausência de “Ainda sem avaliações” permanece. A variante antiga de CompanyGallery continua disponível para seus outros consumidores.

## Arquivos

Alterados:

- `src/components/provider-showcase.tsx`
- `src/components/company-gallery.tsx`
- `src/app/globals.css`
- `tests/provider-showcase.test.ts`
- `.gitignore`

Adicionados:

- `scripts/qa-provider-polish.tsx`
- Este relatório e capturas/medições em `docs/prestador-polimento/`

Retirados do versionamento:

- `.next-local.stderr.log`
- `.next-local.stdout.log`

`*.log` agora é ignorado. As cópias locais desses dois logs continuam abertas pelo servidor em execução e não puderam ser apagadas fisicamente; não voltam ao Git. Documentação/capturas anteriores foram mantidas.

## Verificação

- TypeScript e ESLint dos arquivos envolvidos: passaram.
- `git diff --check` e verificação das exclusões no índice: passaram.
- 73 testes relacionados passaram: vitrine, página pública/editor, serviços, métricas, pedidos, orçamento, capas/galeria, cidades e WhatsApp. Foram acrescentados três casos relevantes para descrição longa, composição por quantidade e compatibilidade da galeria.
- Chrome headless isolado, sem dependência instalada: 48 combinações nas larguras 375, 390, 430, 768, 1024 e 1440px. Sem overflow horizontal da página/diálogo ou erros de execução.
- Pintada real: uma foto e um serviço. Conferidos o formulário sob demanda, serviço selecionado, diálogo centralizado/drawer inferior, Tab/Shift+Tab, Escape, retorno de foco, scroll bloqueado e sticky.
- Ampliação real da foto conferida em desktop e mobile, com fechamento por Escape.
- Fotos/serviços em quantidades 1, 2, 3 e 6 foram verificados em renderizações isoladas usando os mesmos assets da Pintada, sem criar registros. As renderizações estáticas validam composição/CSS; interações foram exercitadas na página real.
- Também conferidos: sem capa/logo/fotos/serviços, só WhatsApp e textos longos, incluindo leitura expandida limitada a 140px.
- Nenhum pedido válido foi enviado e nenhuma métrica/dado da empresa foi criada ou modificada durante a QA. As requisições de métricas do navegador de teste foram respondidas localmente.

## Capturas

Em `docs/prestador-polimento/`:

- Desktop 1440: página inteira, primeira dobra, hero, trabalho único, serviço único, contato e foto ampliada.
- Mobile 390: página inteira, primeira dobra, hero, trabalhos, serviço, contato, contato/footer/sticky e foto ampliada.
- Arquivos `fixture-*`: cenários de quantidade/ausência/textos longos, identificados como testes, não cadastros reais.
- `responsividade.json`: medidas dos 48 cenários.

## Reproduzir a QA

Com o servidor Windows na porta 3000 e um runtime existente de Playwright disponível:

```powershell
$env:PLAYWRIGHT_MODULE = 'caminho\para\playwright'
node --env-file=.env --import tsx scripts/qa-provider-polish.tsx
```

O script usa Chrome instalado, uma sessão isolada e consulta somente os dados públicos da Pintada. Para usar outro canal já instalado, definir `PROVIDER_QA_BROWSER_CHANNEL`.

## Pendências

Nenhuma pendência funcional criada nesta rodada. Avaliações reais continuam sendo uma funcionalidade futura, sem dados/schema nesta entrega. As cópias locais dos logs poderão ser apagadas depois que o servidor liberar os arquivos; as exclusões do versionamento já estão preparadas.
