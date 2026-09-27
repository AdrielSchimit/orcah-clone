# Polimento final — 27/09/2026

Base aprovada (`develop` em `748cc3e`). Nesta passada não entrou feature nova, e não foram tocados `main`, Production, Supabase estrutural ou Asaas.

## Como foi verificado

- Servidor local descartável (SQLite) com dados de vitrine:
  - uma empresa com clientes de nome curto e longo, com e sem e-mail/endereço;
  - 4 serviços: destaque, preço oculto e desativado;
  - orçamentos em todos os status: rascunho, enviado, visualizado, alteração pedida, nova versão, aprovado e recusado;
  - pedidos da página e métricas;
  - uma conta nova zerada, para ver os estados vazios.
- Chrome headless em **320, 360, 375, 390, 430 e 768 px**: 32 telas por largura, 192 combinações. Em cada uma:
  - overflow horizontal e elemento passando da borda;
  - texto `undefined` / `null` / `NaN` / `Prisma` / `[object Object]`;
  - texto cortado e imagem deformada;
  - input sem rótulo e botão sem nome;
  - alvo de toque pequeno;
  - conteúdo coberto pela barra no fim da rolagem;
  - mascote em cima de qualquer botão/link/campo, com a rolagem feita de 40 em 40 px.
- Prints do viewport real revisados um a um em 375/390.

Telas: `/login`, `/cadastro`, `/verificar-email`, `/recuperar-senha`, `/redefinir-senha`, `/painel` (com dados e zerado), `/painel/clientes`, `/painel/clientes/[id]`, `/painel/orcamentos`, `/painel/orcamentos/novo`, `/painel/orcamentos/[id]` (alteração pedida, nova versão, aprovado), `/painel/pagina`, `/painel/servicos`, `/painel/servicos/novo`, `/painel/pedidos`, `/painel/relatorios`, `/painel/mais`, `/painel/conta`, `/empresa/[slug]` (completa e zerada), `/orcamento/[token]` (alteração, nova versão, aprovado).

Resultado final: nenhum overflow, nenhum texto quebrado ou técnico, nada coberto pela barra e o mascote nunca visível em cima de alvo.

## Problemas encontrados e corrigidos

| # | Problema | Correção | Commit |
|---|---|---|---|
| 1 | **Home:** cliente com nome longo esticava o grid de "Últimos orçamentos" para 501 px numa tela de 390 → **valor e status sumiam da tela**. O detector comum não pegava (sem rolagem horizontal). Mesmo padrão na lista de serviços. | `grid-cols-1` (coluna `minmax(0,1fr)`); nome trunca com reticências. | `c4aac09` |
| 2 | Status "Alteração pedida" quebrava em duas linhas; "Ver todos" desalinhado do título. | `whitespace-nowrap` no status; link centralizado. | `c4aac09` |
| 3 | Serviço sem preço mostrava "Sem categoria"; preço oculto sem indicação. | "Preço a combinar"; etiqueta "Preço oculto na página". | `c4aac09` |
| 4 | **Mascote** passava por cima do CTA "Criar orçamento" e dos cards de ação durante a rolagem. | O botão do assistente continua no mesmo lugar, mas some (fade) enquanto houver botão, link ou campo embaixo dele e volta quando a área fica livre. Varredura de rolagem: 0 sobreposições visíveis. | `21b71cb` |
| 5 | **Barra de baixo:** rótulo "Orçamento" 2–8 px mais baixo que os outros. | Círculo posicionado sobre um espaço do tamanho de um ícone; rótulos na mesma linha (medido: todos em 769 px), elevado ou não. Desenho mantido. | `207867b` |
| 6 | **Fotos do orçamento gravavam no disco do servidor** (`public/uploads`). Na Vercel o disco é somente leitura → anexar foto falhava em produção e **devolvia a mensagem técnica do erro** ao usuário. | Vão para o Supabase Storage como as fotos da página (`companies/{id}/budgets/{orçamento}/`, WebP). Erro inesperado vira "Não foi possível enviar a foto. Tente de novo." e só o nome do erro vai para o log. O PDF baixa a foto (só do nosso bucket, timeout 6 s) e converte para JPEG (PDFKit não lê WebP); fotos antigas em `/uploads` continuam funcionando. Removido o `saveUpload` morto. Teste novo no storage; testado local: upload, GIF recusado com mensagem humana, PDF com a foto embutida, remoção. | `6b5c426` |
| 7 | **Ciclo de alteração:** a tela não dizia o que fazer; depois de salvar, nada lembrava que o cliente precisa receber o link de novo; histórico mostrava "R$ 12.400,00 → R$ 12.400,00". | Caixa "O cliente pediu uma alteração" com a mensagem dele e o próximo passo; botão **Salvar nova versão**; depois de salvar, aviso verde "Nova versão pronta para aprovação — avise o cliente pelo WhatsApp, o link é o mesmo"; "Valor mantido" quando o total não muda. Lógica do César intacta. | `0247dcb` |
| 8 | Quantidades "380.00 m²" (ponto e zeros) no painel e na página pública. | "380 m²", "12,5 m²". | `0247dcb` |
| 9 | Telefone cru ("49955554444") na busca de cliente do orçamento. | Formatado "(49) 95555-4444" como no resto do app. | `0247dcb` |
| 10 | Chips de serviço e forma de pagamento com 28–30 px de altura; "+ Novo cliente" com 20 px; "Salvar no catálogo" com 16 px; "Voltar ao login" com 20–24 px. | Mínimo de 36–44 px. | `0247dcb`, `319d22d` |
| 11 | 15 campos só com placeholder (busca de cliente, desconto, entrada, validade, legendas, formulário da página pública, e-mail da verificação). | `aria-label` em todos. | `319d22d` |
| 12 | Formulário de orçamento podia mostrar erro técnico ("Unexpected token…") se o servidor falhasse; tons diferentes de "Falha de conexão." | Mensagem humana; tom padronizado ("Falha de conexão. Tente de novo."). | `0247dcb`, `319d22d` |
| 13 | "Confira seu e-mail" seca; "e-mail" quebrando no hífen; checklist dizia "8 caracteres". | Mascote na tela (pose explicando / sucesso), dica de olhar o spam, texto sem quebra; "8 ou mais caracteres". | `319d22d` |

## O que decidi NÃO mexer

- **Rotas de plano/Asaas** (`api/plano/cartao`, `api/plano/pix`, `plan-checkout`) também repassam `error.message` ao usuário — ficou fora por regra da missão. Pendência abaixo.
- `window.confirm` ao remover foto da página: é uma confirmação de exclusão, faz sentido nativa.
- Logo do topo do painel com 28 px de altura (link secundário, não é ação).
- Banner "7 dia(s) de teste" em todas as telas (é do plano/Asaas).
- Cores: nenhuma cor padrão do Tailwind perdida (verde/azul antigos); os hex que existem são temas da página e a simulação do WhatsApp.
- Evento "Cliente visualizou" pode aparecer repetido se o cliente abrir em duas abas ao mesmo tempo (raro, só histórico).

## Pendências reais

1. **Resend** (continua bloqueando o E2E real de cadastro/recuperação e a publicação) — ver `docs/FINAL_RELEASE_REPORT.md`.
2. Rotas de pagamento (Asaas) repassando mensagem de erro crua — revisar quando mexer no plano.
3. Confirmar no Preview uma foto de orçamento real (sobe para o bucket `company-assets`) e o PDF com ela.
4. Teste no celular de verdade (safe-area do iPhone, teclado sobre a barra de Total).

## Ideias anotadas (não implementadas)

- Aviso automático ao cliente quando sai uma nova versão (hoje o prestador reenvia pelo WhatsApp).
- Guardar os itens da versão anterior (hoje só totais e observações).

## Verificação

`npm test` 144/144 · `db:validate` · `typecheck` · `lint` (0 avisos) · `build` — tudo verde.
Branch `develop`; commits `c4aac09`…`319d22d` + este relatório.
