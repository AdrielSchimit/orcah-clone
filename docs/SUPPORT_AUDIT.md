# Auditoria — Issue #5

Base principal: `2511268` (`origin/main` e `feat/mascote-support-chat`). Base Control: `cf1668f` (`origin/develop` e `feat/support-inbox`). Checkouts estavam limpos; branches de trabalho criadas a partir das branches remotas solicitadas. Nenhuma alteração em main/develop.

- Autenticação do prestador: `getSessionUser` valida JWT httpOnly, revogação por troca de senha e confirmação quando há e-mail; contas identificadas somente por telefone também são permitidas. `requireCompany` fornece usuário/empresa no servidor.
- Painel: `src/app/painel/layout.tsx`; assistente atual só oferece dicas efêmeras. Mascote e avatar já existem em `src/assets/mascote`.
- Persistência: Prisma 6/PostgreSQL no aplicativo principal. Relações Company/User e Subscription disponíveis. Não executar deploy/migrate contra produção.
- Gateway existente: `POST /api/internal/control`, header `x-orcah-control-secret`, variável `CONTROL_INTERNAL_SECRET`. Control usa `controlApi` e sessão JWT própria com contas internas.
- Exceção encontrada no Control: página Asaas ainda consulta Prisma para nomes de empresas. Deve passar pela ponte para cumprir a arquitetura. `src/lib/db.ts` ficará sem uso e será removido; build não deve gerar cliente Prisma como requisito de conexão.
- Transporte MVP: polling autenticado de 2 segundos, sem assinatura pública de tabelas. Separar transporte/hooks da apresentação; pausar em aba oculta, reconectar e reconciliar por ID da requisição.
- Domínio: uma conversa persistente por usuário/empresa; estados BOT/QUEUED/HUMAN/RESOLVED e prioridade NORMAL/HIGH. Escritas serializadas por thread no PostgreSQL; ações de operador auditadas por mensagens SYSTEM. Idempotência por chave de mensagem e limites persistentes por janela.
- Segurança: somente dados selecionados para contexto, identidade do operador originada na sessão do Control, nenhum papel de remetente aceito do prestador. Texto renderizado pelo React; sem HTML/Markdown arbitrário. Base local versionada e provider opcional com fallback.

Ordem: schema/domínio/testes → APIs prestador → chat → gateway → inbox → retrieval/provider → integração/validação. Testes locais não usam banco de produção.
