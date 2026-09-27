# Página comercial, serviços e métricas

> "Seu orçamento, seus clientes e sua presença profissional em um só lugar."
> Preenche → salva → ficou bonito. Sem editor de blocos, sem arrastar, sem HTML.

## Navegação

Celular (5 destinos): **Início · Clientes · Orçamentos · Página · Mais**.

- `Mais` reúne Pedidos (com badge de novos), Serviços, Relatórios, Ver minha página, Conta, Plano e Sair.
- Pedidos novos aparecem também no Início ("1 novo pedido") e como badge no ícone `Mais`.
- Desktop: a lateral mostra os 5 destinos + grupo "Negócio" (Pedidos, Serviços, Relatórios).
- `/painel/empresa` (tela antiga) redireciona para `/painel/pagina`.

## Início (`/painel`)

Saudação (Bom dia/Boa tarde/Boa noite, fuso de São Paulo), aviso de pedidos novos, 4 cards:

| Card | Definição |
| --- | --- |
| Acessos à página | soma dos últimos 7 dias; compara com os 7 dias anteriores |
| Pedidos recebidos | `QuoteRequest` criados nos últimos 30 dias |
| Orçamentos | criados no mês corrente |
| Aprovados | `approvedAt` no mês corrente + soma do total |

Depois: card escuro "Novo orçamento" (dourado só no brilho/botão), atalhos (Editar página, Cadastrar serviço, Ver relatório, Pedidos) e os 5 últimos orçamentos.
Após o onboarding a URL recebe `?bemvindo=1` e mostra "Sua empresa foi criada 🎉" com [Fazer orçamento] [Montar minha página]. O onboarding não ganhou perguntas novas.

## Editor da página (`/painel/pagina`)

- Topo: link público, "Visualizar minha página", Copiar link / Compartilhar (Web Share API no celular, cópia como alternativa) / Abrir.
- Progresso "Sua página está X% completa" (7 itens) com atalhos para o que falta. Não bloqueia nada: a página é pública desde o cadastro.
- Seções em sanfona (`<details>`, sem abas horizontais): **Perfil** (nome, descrição, estado/cidade, "atendo cidades vizinhas", horário), **Serviços** (resumo + atalhos), **Fotos** (galeria até 12), **Contato** (WhatsApp, telefone, Instagram, Facebook, site), **Aparência** (logo, cor principal e de destaque com 6 combinações prontas + prévia).
- Card discreto de **configuração assistida** (R$ 30 uma vez, sem cobrança por enquanto).
- Tudo salva por `PATCH /api/empresa`, que só aplica os campos enviados e usa sempre a empresa da sessão (qualquer `companyId`/`slug` vindo do navegador é ignorado).
- Reaproveita as colunas que já existiam em `companies` (name, description, whatsapp, instagram, facebook, website, openingHours, primaryColor, secondaryColor, logoPath...). Nenhuma coluna nova na empresa.

## Página pública (`/empresa/[slug]` ou subdomínio)

Mobile-first: hero com logo, nome, ramo · cidade, descrição, [Pedir orçamento] [WhatsApp]; serviços (destaques primeiro, foto, categoria, descrição, preço só se o prestador ligou "Mostrar preço"); galeria em grade com foto ampliada; contato; formulário de pedido (o mesmo `QuoteRequest` de sempre, com o serviço já preenchido quando o cliente toca "Pedir orçamento" num serviço).

- Dados montados em `getPublicCompanyPage` (`src/lib/public-page.ts`): só campos públicos. Documento, e-mail, endereço, usuário e preços escondidos **não saem do servidor**.
- SEO: `title` "Nome | Orçah", descrição, OpenGraph (logo como imagem quando é URL pública).
- Empresa inexistente → 404.

## Serviços (`/painel/servicos`)

Modelo `Service` evoluído (sem jogar fora): `category`, `imagePath`, `featured`, `showPrice` (padrão **não**), `sortOrder`, além de nome, descrição, preço padrão, unidade e `active`.

- Lista com foto, ↑ ↓ para ordenar, destacar e ativar/desativar em um toque.
- Formulário com foto (câmera ou galeria), categoria com sugestões das já usadas, preço e unidade.
- "Serviço ativo" desligado some da página **e** da lista do orçamento (mesmo campo `active` de antes).
- `POST /api/servicos` continua sendo "salvar pelo nome" (o botão "salvar no catálogo" do orçamento não duplica nem apaga categoria/foto/destaque).
- APIs: `PATCH /api/servicos/[id]`, `POST /api/servicos/ordem`, `POST|DELETE /api/servicos/[id]/foto`. Todas conferem `companyId` da sessão.

## Storage (Supabase Storage, plano free)

`src/lib/storage.ts` — logo, galeria e fotos de serviço.

- Upload **só no servidor**, pela API REST do Storage com a service role. A chave nunca vai para o navegador nem para a URL.
- Caminhos montados pelo servidor a partir da empresa da sessão:
  - `companies/{companyId}/logo/...`
  - `companies/{companyId}/gallery/...`
  - `companies/{companyId}/services/{serviceId}/...`
- Validação: sessão + dono do serviço, MIME (JPG/PNG/WEBP), extensão, tamanho (até 8 MB) e leitura real da imagem (arquivo que "finge" ser JPG é recusado).
- A imagem é reorientada, reduzida (logo 512px, galeria 1600px, serviço 1200px) e convertida para WEBP com `sharp`.
- No celular a foto é reduzida antes de enviar (a Vercel corta requisições acima de ~4,5 MB).
- Apagar só remove arquivos dentro de `companies/{companyId}/` da própria empresa.
- Bucket `company-assets` público para leitura; se não existir, é criado automaticamente no primeiro upload.

### Envs (servidor)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=company-assets   # opcional
```

Sem essas envs:
- **Vercel (produção/preview):** upload responde "Envio de fotos ainda não está configurado" — nada é salvo no disco da Vercel.
- **Dev local:** salva em `public/uploads/companies/...` (o mesmo comportamento que o projeto já tinha), para testar sem Supabase.

Fotos de **orçamento** (`BudgetPhoto`) continuam no fluxo antigo (`src/lib/upload.ts`), fora do escopo desta entrega.

## Métricas da página

Tabela `company_page_daily_stats`: uma linha por empresa por dia (`views`, `whatsapp_clicks`, `quote_clicks`), único em `(company_id, date)`, dia no fuso de São Paulo.

- Contagem pelo navegador (`sendBeacon`) em `POST /api/publico/empresas/[slug]/metrica` com `tipo` = `view` | `whatsapp` | `quote`.
- **Sem IP, sem cookie de rastreio, sem identificar pessoa.**
- Robôs óbvios (user agent de bot, preview de WhatsApp/Facebook, curl...) não contam. O dono logado vendo a própria página não conta.
- Chamamos de **Acessos**, não "pessoas": atualizar a página conta de novo.
- Tocar "Pedir orçamento" num serviço (`?servico=`) conta um `quote`, não um acesso novo.
- A resposta é sempre `204` (não confirma se a empresa existe).

## Relatórios (`/painel/relatorios`)

Períodos 7 / 30 / 90 dias. Acessos (com 1 gráfico de barras em SVG puro, sem biblioteca), cliques no WhatsApp, pedidos recebidos, orçamentos criados, aprovados, valor aprovado, taxa de aprovação e orçamentos por cidade (bloco que antes ficava no Início).

- **Taxa de aprovação** = dos orçamentos criados e enviados no período, quantos já foram aprovados (sem envio no período → "—").
- **Aprovados / Valor aprovado** = `approvedAt` dentro do período.
- "Visão geral do período" mostra acessos → pedidos → orçamentos → aprovados lado a lado, com o aviso de que **não é taxa de conversão** (nem todo orçamento vem da página).

## Configuração assistida

Tabela `assisted_setup_requests` (`requested`, `contacted`, `in_progress`, `completed`, `canceled`). O botão "Quero ajuda" só registra o pedido (`POST /api/setup-assistido`); se já existe um aberto, devolve o mesmo (não duplica). Nenhuma cobrança nem Asaas. A fila fica pronta para o ORÇAH CONTROL ler depois (índice por `status, created_at`).

## Mascote

Continua determinístico (sem IA). Dicas novas: Página ("Cadastre seu primeiro serviço…", "Uma foto boa ajuda…", "Uma página com fotos e serviços passa mais confiança 👀", "Sua página tá ficando profissional 😎"), Serviços, Relatórios e Conta. Estados vazios com mascote em Serviços, Fotos e Pedidos.

## Conta (`/painel/conta`)

Perfil (nome, e-mail), Empresa (nome, ramo, área → "Editar dados da página"), Plano, Segurança ("Trocar senha" → `/recuperar-senha`) e Sair. Configuração da página não se mistura com senha.

## Migration

`prisma/migrations/20260926120000_pagina_comercial/migration.sql` — **só aditiva**:

- `services`: `category`, `image_path`, `featured` (default false), `show_price` (default false), `sort_order` (default 0).
- Tabelas novas `company_page_daily_stats` e `assisted_setup_requests` + enum `AssistedSetupStatus`.
- Nenhum `DROP`, nenhum `UPDATE`/`DELETE` em dados existentes.

## Testes

- `tests/pagina.test.ts` — slug público, 404, só campos públicos, preço escondido, patch do editor ignora campos de outra empresa, progresso, setup assistido (cria, não duplica, empresa só vê o seu).
- `tests/servicos.test.ts` — criar, editar, desativar, ordenar, nome duplicado, empresa A não edita/reordena serviço da B.
- `tests/metricas.test.ts` — view/WhatsApp/pedido incrementam, uma linha por dia, fuso de SP, robôs, série diária, agregação 7/30/90 sem misturar empresas, taxa sem envio, comparação semanal.
- `tests/storage.test.ts` — formatos, arquivo enorme, arquivo falso, redução para WEBP, caminho sempre da empresa, apagar arquivo alheio recusado, service role só no header, produção sem storage não grava no disco.
- `tests/helpers/fake-db.ts` — banco em memória com o pedaço do Prisma usado.

## Pendências

- Configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no Preview/Production da Vercel para as fotos funcionarem lá.
- Rodar a migration no banco (`npm run db:deploy`) antes de testar o Preview com o banco oficial.
- Fotos de orçamento ainda usam o disco (fluxo antigo).
- Trocar senha dentro do app depende da branch de autenticação (`codex/auth-segura`).
- Fila de configuração assistida no ORÇAH CONTROL e cobrança dos R$ 30.
- Templates de página (hoje há um layout base + cores).
