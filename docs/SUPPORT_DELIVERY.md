# Entrega — Assistente ORÇAH e suporte humano (Issue #5)

Branch main: `feat/mascote-support-chat`, base `2511268`. Control: `feat/support-inbox`, base `cf1668f`. Trabalho recente do César preservado. Nenhum merge em main/develop e nenhuma escrita em banco de produção.

## Comportamento

- Mascote existente, badge, drawer persistente e mobile em tela cheia. Bubbles USER/ASSISTANT/OPERATOR/SYSTEM, confirmação de leitura, envio otimista, retry idempotente e histórico paginado.
- Uma conversa por usuário/empresa: BOT → QUEUED → HUMAN → RESOLVED. Cancelamento da fila, reabertura, retorno ao assistente e prioridade NORMAL/HIGH; mudanças auditadas em mensagens SYSTEM.
- Inbox Control com fila, busca, filtros, não lidas, ações e contexto compacto; desktop com três colunas e mobile com volta à lista/contexto expansível.
- Polling autenticado a cada ~2 s, pausa offline/aba oculta e reconexão com backoff até 30 s. SupportTransport separa transporte/UI. Escolhido para o MVP por não depender de conexões longas em funções Vercel; SSE requer medição no runtime antes da troca.
- Base local versionada com 17 documentos em src/lib/assistant/knowledge.ts, retrieval por termos/rota e interface de provider. Sem embeddings ou chave, respostas determinísticas. Dúvidas sem cobertura encaminham para pessoa sem inventar situação da conta.

## Banco e implantação pendente

Migration: `prisma/migrations/20261007160000_support_chat/migration.sql`. Adiciona enums, tabelas, relações, índices e constraint de tamanho. Habilita RLS e revoga acesso de PUBLIC/anon/authenticated. O papel PostgreSQL da main precisa ser proprietário das tabelas ou ter BYPASSRLS; nenhum acesso público às tabelas foi criado.

SQL aplicado **somente em PostgreSQL local dedicado** para teste. Revisar e planejar aplicação no ambiente aprovado antes de habilitar o chat em produção ou validar previews com banco persistente. Sem tabelas, APIs retornam indisponibilidade e UI oferece reconexão. Nenhum migrate deploy de produção executado.

Main: credenciais de banco/auth existentes e CONTROL_INTERNAL_SECRET (mesmo valor do Control, >= 32 bytes). IA opcional: OPENAI_API_KEY **e** SUPPORT_AI_MODEL, somente server-side. Adaptador Responses API com store:false e timeout de 8 s. Envia somente intenção curada, documentos e rota normalizada; não envia pergunta livre, histórico, identidade, contato, empresa/ramo, tokens ou documentos pessoais. Falha/timeout/configuração ausente usam a base local. Provider real não acionado nesta validação.

Control: CONTROL_APP_URL apontando para a main correspondente, segredo da ponte e auth/credenciais internas existentes. **Não configurar DATABASE_URL/DIRECT_URL/Service Role no Control.** Previews exigem main/Control pareados e banco de teste separado migrado. Não apontar teste de chat para produção.

## Validação

Suites: main 233 testes; Control 18. TypeScript, ESLint dos arquivos modificados e builds de ambos executados. Resultados finais também constam na entrega da conversa.

Teste HTTP real scripts/support-integration.ts: dois servidores Next, duas contas fictícias e PostgreSQL local. Cobre isolamento, remetente forjado, segredo/sessão, RAG, persistência, idempotência, fila, claim, resposta humana, leitura, prioridade, resolução, retorno ao mascote, retries simultâneos, disputa de dois operadores, tamanho/rate limit, paginação e 16 permissões SQL de browser negadas com RLS ativo.

Para reproduzir: preparar **somente** PostgreSQL local dedicado chamado orcah_support_test, aplicar schema anterior e esta migration nesse banco, instalar dependências nos dois checkouts, definir SUPPORT_TEST_DATABASE_URL e executar npm run test:support:integration. Script recusa host remoto/outro banco, inicia portas 3100/3101, gera credenciais fictícias e limpa usuários ao finalizar. SUPPORT_TEST_CONTROL_DIR permite outro caminho do Control. Nunca usar credenciais reais.

Verificação visual local: pergunta → resposta do mascote → fila → claim Adriel → identificação no prestador → mensagem humana → resolução → retorno ao assistente. Desktop e mobile de 390 px conferidos com fixtures fictícias. Evidências: [Control desktop](support-evidence/control-desktop.jpg) e [prestador mobile](support-evidence/prestador-mobile.jpg).

## Limitações e fase 2

- Sem voz, anexos, WhatsApp, SLA, departamentos, analytics ou automações.
- Dois operadores internos existentes; leitura compartilhada pelo time. Gestão de operadores/auditoria detalhada de leitura ficam para fase 2.
- Sem fila durável de geração: interrupção do processo entre pergunta salva e resposta salva pode exigir retry. Adicionar outbox/jobs e observabilidade.
- Limites por conversa: 15 mensagens/min prestador, 30 operador e 12 mudanças/min. Poll/read sem limiter distribuído global; medir volume/custo antes de escalar.
- Retrieval lexical, sem memória semântica ou execução de ações na conta. Fase 2: curadoria/avaliação, retenção/expurgo e SSE/canal privado medido.
- DTO/transporte/reconciliação espelhados nos dois repositórios; extrair pacote comum quando houver pipeline compartilhado.

## Arquivos

Main: schema/migration; src/lib/support/* (domínio, serviço, segurança, gateway, DTO, transporte, hook); src/lib/assistant/*; APIs support/[action] e internal/control; assistente.tsx/CSS; quatro suites; integração; ambiente, auditoria e evidências.

Control: APIs support/[...path]/proxy; control-api.ts; página suporte; inbox/CSS/hooks; DTO/transporte/reconciliação; navegação; Asaas pela ponte; remoção de db.ts; suite; build, README e ambiente. Lista exata no diff de cada commit.
