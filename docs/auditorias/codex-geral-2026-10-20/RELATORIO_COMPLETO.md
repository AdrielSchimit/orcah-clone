# Auditoria geral ORÇAH 1.0 — 20/10/2026

## Veredito e escopo

**O produto não está tecnicamente pronto para ampliar operação e cobranças.** A jornada principal funciona localmente, mas há exposição crítica no banco e falhas de autenticação, cobrança e autorização do Kanban. Apenas o PR #8 está tecnicamente liberado para merge agora.

**23 achados: 1 P0, 5 P1, 13 P2 e 4 P3.** Foram aprovadas 427 verificações locais, sem assertion falha na execução final. Testes chamados BUG aprovados confirmam o defeito descrito; não comprovam correção. Os comandos lint de main e Control falharam. Resultados repetidos nas heads dos PRs estão separados em RESULTADOS_TESTES.md.

| Projeto | Snapshot auditado | Tecnologia |
| --- | --- | --- |
| orcah-clone | main, dac04180a2d7a3ef4379e41029abbe0ed5517170 | Next 16.3.5, React 19.2.8, TypeScript, Prisma 6.19, PostgreSQL, Tailwind, Sharp, PDFKit |
| orcah-control | develop, e375dcae44840eefbe7e8a3832f6ea8eb3f55190 | Next 16.3.6, React, TypeScript e gateway administrativo |
| operacao-orcah | main, 62f68bc6337dcd970fc6dcfa5524cbd55845908c | HTML/CSS/JS, localStorage, Supabase JS/Realtime |

Branch da entrega: codex/auditoria-geral-2026-10-20, em checkout isolado. Nenhuma alteração de produto, merge, deploy de produção, env, SQL no Supabase real, e-mail real ou cobrança foi executada.

Houve revisão independente de arquitetura e baseline de segurança, investigações de backend financeiro e frontend/PRs, e validação pelo agente principal. Os agentes atingiram limite de uso durante a investigação; as reproduções e a entrega foram concluídas pelo principal. A cobertura de fonte é **parcial**, concentrada nos caminhos críticos. Não foi lido integralmente cada componente visual, ativo e dependência. Não se declara certificação exaustiva.

Os checkouts originais foram preservados: aplicação em feat/mascote-support-chat/047fecc, inclusive scripts/support-db-checks.ts preexistente; Control em feat/support-inbox/760eeaa. Documentação Next instalada foi consultada conforme AGENTS.md antes dos harnesses relacionados. As evidências de runtime usam módulos reais com mocks ou PostgreSQL descartável; mocks não equivalem a homologação de provedores.

## Arquitetura, branches e deploys

O navegador recebe JWT HttpOnly, SameSite=Lax e Secure em produção. As APIs privadas derivam empresa da sessão. Prisma usa DATABASE_URL; DIRECT_URL atende operações Prisma. Vitrine, busca e propostas por token são superfícies públicas intencionais. O link de proposta é uma capability: possuir o link permite ações previstas pelo ciclo comercial.

Uploads passam pelo servidor, montam prefixos da empresa e são convertidos para WebP. Service role é usada no servidor; o bucket é público para leitura. PDFKit combina dados e imagens. Control autentica operadores e usa segredo servidor-servidor no gateway da aplicação. O suporte tem controles específicos de ownership, origem, limites e idempotência.

O Kanban tem outra fronteira: um modal e uma identidade em localStorage não autorizam acesso ao banco. Seus documentos inteiros são sincronizados via chave publicável e políticas Supabase.

Refs encontrados em orcah-clone: main, develop, feat/mascote-support-chat, codex/auth-segura, audit/2026-10-15-public-data-api-hardening, fix/municipios-script-tsx-resolution, fix/asaas-card-pending-20261020, fix/missing-provider-photos-recovery-20261019, preview/liquid-dock-orcah, claude/crm-orcamentos, claude/pagina-comercial, diag-control-db, migration/data-copy, teste-hero e teste-hero-2. Existência de ref não comprova atividade humana atual.

Control mantém develop, feat/support-inbox e ui-refresh-control. Kanban mantém main e audit/2026-10-15-secure-workspace-auth; essa última foi identificada, sem aprovação de integração nesta auditoria.

Os três últimos deploys de produção consultados na Vercel estavam READY nos SHAs da tabela. READY comprova conclusão do deploy, não integridade de pagamentos, segurança ou recuperação de backup. Nenhum deploy de produção foi solicitado. Publicar a branch de auditoria pode acionar CI/Preview automaticamente pelas integrações existentes.

PR11 está empilhado sobre PR8; PR3 conflita com develop e sobrepõe trabalho já integrado. Ver MATRIZ_MERGE.md para versões exatas e dependências.

## Banco real: metadados somente leitura

Foi encontrado um projeto Supabase ativo, sem development branches listadas. As roles orcah_production_app e orcah_preview_app são NOSUPERUSER/NOBYPASSRLS. Ambas têm acesso amplo onde a política server-role permite.

**Nomes de roles distintos não comprovam isolamento Preview/Production.** Não foram lidos valores de env Vercel para estabelecer os destinos reais das conexões. Nenhum teste de isolamento entre ambientes foi executado.

As 21 tabelas seguintes têm RLS=false e SELECT/INSERT/UPDATE/DELETE efetivos para anon e authenticated:

    _prisma_migrations, assisted_setup_requests, auth_attempts, budget_events,
    budget_items, budget_photos, budget_versions, budgets, business_categories,
    cities, companies, company_page_daily_stats, company_photos, customers,
    email_verification_tokens, password_reset_tokens, quote_requests, services,
    states, subscriptions, users

**A contagem inclui _prisma_migrations: são 20 tabelas de negócio mais a tabela de migrations.** Não são 21 mais uma.

support_threads e support_messages têm RLS habilitada e sem CRUD de browser, com políticas ALL para as duas roles servidor. Isso não cria isolamento por empresa dentro dessas roles; a autorização da aplicação continua necessária.

orcah_ops_shared_documents existe em public e ops_api. As políticas permitem ao papel público ler o workspace operacional e inserir/atualizar kanban, mindmap, ux e columns. DELETE tem grant, mas nenhuma política permissiva de DELETE foi observada; não se afirmou exclusão direta por esse comando.

company-assets é público; file_size_limit e allowed_mime_types estavam nulos nos metadados. A aplicação limita 8 MiB e converte imagens. O valor nulo no bucket é lacuna de defesa, sem provar upload público direto.

O advisor de segurança retornou lints vazios apesar do estado acima. Esse resultado não pode ser usado isoladamente como garantia de segurança. Não foram consultadas linhas privadas de clientes.

### PR7 em PostgreSQL descartável

Foi criado cluster exclusivo em 127.0.0.1:55449. O SQL do PR7 foi aplicado intacto na fixture do PR e na cadeia real de migrations main. O bootstrap da fixture foi adaptado apenas para não recriar roles globais já presentes.

As duas roles da aplicação fizeram CRUD real via Prisma sem BYPASSRLS; anon/authenticated receberam 42501. Reexecução do SQL e migrate deploy sem pendências funcionaram. As 23 tabelas do schema main local, incluindo suporte, ficaram protegidas.

A jornada HTTP foi executada nesse banco com DATABASE_URL de orcah_preview_app. Isso prova compatibilidade local além de SELECT 1. Não comprova configuração correta em produção. A lacuna de tabelas futuras está em A17. Nenhum SQL de alteração foi enviado ao Supabase.

## Achados

As referências main abaixo são relativas ao snapshot dac0418; Control a e375dca; Kanban a 62f68bc. A17 referencia a head PR7 e29abfc. Arquivo e linha identificam a causa ou operação afetada. Os testes estão nesta pasta ou na suíte existente explicitamente indicada.

| ID | Nível | Problema |
| --- | --- | --- |
| A01 | P0 | CRUD público em 21 tabelas privadas |
| A02 | P1 | Confirmação de cadastro mantém senha definida por terceiro |
| A03 | P1 | Cartão libera plano sem confirmar pagamento |
| A04 | P1 | Checkout concorrente/timeout duplica assinaturas |
| A05 | P1 | Documentos do Kanban sem autenticação efetiva |
| A06 | P1 | HTML de documento UX chega a innerHTML sem encoding |
| A07 | P2 | Replay e ordem de eventos alteram vigência indevidamente |
| A08 | P2 | Webhook antecipado é reconhecido e perdido |
| A09 | P2 | Recuperação de cobrança pendente/vencida/disputada incompleta |
| A10 | P2 | Conteúdo privado permanece no cache após logout |
| A11 | P2 | Lead anônimo renomeia cidade compartilhada |
| A12 | P2 | Flood e textos grandes na entrada pública de pedidos |
| A13 | P2 | Resposta concorrente sobrescreve orçamento aprovado |
| A14 | P2 | Login aceita formulário cross-site compatível com JSON |
| A15 | P2 | Cadastro aceita senha de um caractere |
| A16 | P2 | Kanban perde edição concorrente por sobrescrita integral |
| A17 | P2 | PR7 não corrige defaults de tabelas futuras |
| A18 | P2 | SVG disfarçado alcança parser nativo com advisory |
| A19 | P2 | Galeria não trata referências legadas sem arquivo |
| A20 | P3 | Gates de lint falham nos dois apps |
| A21 | P3 | Sessão anterior à troca de senha sobrevive no mesmo segundo |
| A22 | P3 | Health público consome integrações privilegiadas |
| A23 | P3 | Documentação operacional contradiz arquitetura atual |

### A01 — P0: CRUD público em 21 tabelas privadas

**Fonte:** main/prisma/migrations/20260924194650_baseline_orcah_postgres/migration.sql:40; main/prisma/schema.prisma:117; grants/RLS reais descritos acima.

**Causa e impacto:** tabelas de usuários, hashes, contatos, propostas e assinaturas estão acessíveis às roles públicas. Guardas companyId das APIs não protegem acesso direto à camada de dados. Escrita pode corromper credenciais e estado financeiro.

**Evidência/reprodução:** metadados reais confirmam 21/21 sem RLS com os quatro privilégios efetivos para cada role pública. Em banco descartável com grants equivalentes, anon leu usuário fictício no schema real; após PR7, recebeu 42501. Consultar somente fixtures locais com SET LOCAL ROLE e has_table_privilege.

**Limites:** não houve exploração REST, exfiltração ou escrita em produção. A exposição HTTP depende do schema publicado na Data API. Hash de token não é token original.

**Correção e regressão:** concluir hardening com grants/RLS/defaults seguros, verificar roles reais e executar rollout controlado com backup/smoke. Testar CRUD negado nas tabelas privadas e jornada server NONBYPASSRLS permitida. Evidência: tests/rls-local.ts.

### A02 — P1: confirmação mantém credencial de terceiro

**Fonte:** main/src/lib/registration.ts:75; main/src/app/api/auth/verificar-email/route.ts:15.

**Causa:** atacante pré-cadastra e-mail da vítima com senha A. Quando o dono cadastra senha B, a aplicação só reenvia o link, preservando A. Confirmar o link ativa o usuário existente e cria sessão.

**Evidência/reprodução:** bcrypt, JWT e módulos reais em tests/security-regressions.test.ts. Antes de confirmar, atacante recebe 403; após cadastro da vítima e confirmação, A funciona e B recebe 401.

**Impacto/limites:** acesso posterior à conta confirmada; exige cadastro pendente prévio e confirmação pelo dono. Conta já verificada rejeita novo cadastro; não há bypass direto da caixa postal.

**Correção e regressão:** vincular confirmação a nova definição de senha/intenção verificada, invalidando credenciais e sessões anteriores atomicamente. O fluxo A→B→confirmar deve permitir só B ou exigir definição explícita pelo dono.

### A03 — P1: criação de assinatura ativa plano sem prova financeira

**Fonte:** main/src/app/api/plano/cartao/route.ts:92; main/src/lib/asaas-billing.ts:14.

**Evidência:** mock retorna assinatura criada e pagamento PENDING; main chama markPaid, grava active e libera conta vencida. PR11 preserva bloqueio e retorna pending no mesmo caso. Executar backend-financial.test.ts.

**Impacto/limites:** acesso pago sem confirmação. Nenhum cartão real usado; não se afirma que toda recusa retorna sucesso no provedor.

**Correção e regressão:** liberar somente cobrança associada e financeiramente elegível, com processamento idempotente; criada/pendente/negada não ativam conta vencida. CONFIRMED/RECEIVED válidos ativam uma competência. PR11 resolve esta ativação específica, mas não A04/A07–A09.

### A04 — P1: duplicidade financeira por concorrência e timeout

**Fonte:** main/src/app/api/plano/cartao/route.ts:56 e :71; main/src/app/api/plano/pix/route.ts:47; main/src/lib/asaas.ts:45.

**Causa:** criar remotamente precede uma reserva atômica local e gravação dos IDs. Duas leituras podem iniciar duas assinaturas. Timeout após aceite remoto permite retry cego.

**Evidência/reprodução:** main e PR11 criam duas assinaturas em cartão×cartão e Pix×cartão simultâneos. Aceite remoto seguido de timeout e retry duplica operação. Barreiras e contadores de backend-financial.test.ts.

**Impacto/limites:** risco de duas cobranças recorrentes e órfãos. Não foi investigada incidência real. PR11 bloqueia repetição sequencial depois de gravar IDs, sem serializar concorrência.

**Correção e regressão:** operação persistida com chave única, claim atômico, referência externa rastreável e reconciliação antes de retry indeterminado. Usar idempotência do provedor somente se suportada pelo contrato do endpoint. Todos os interleavings devem gerar uma única assinatura.

### A05 — P1: acesso do Kanban depende de estado forjável

**Fonte:** operacao/access.js:20; operacao/sync.js:82, :124 e :303; políticas reais de ops_api/public.

**Causa:** sessão/identidade vêm do localStorage; sincronização usa chave publicável sem autenticação do membro. RLS permite ao papel público o workspace.

**Evidência/reprodução:** frontend-operacao.test.ts aceita identidade forjada sem código; online inicia leitura dos quatro documentos sem sessão. Metadados permitem leitura/insert/update anônimos.

**Impacto/limites:** leitura e alteração do planejamento/autoria. Nenhuma escrita real. Chave publicável não é segredo; não se alegou DELETE permitido por política.

**Correção e regressão:** identidade e membership reais no servidor/Supabase Auth, políticas por membro e autoria derivada da sessão. JWT ausente ou identidade local forjada devem negar acesso no banco.

### A06 — P1: injeção persistente de HTML no UX Studio

**Fonte:** operacao/ux-studio.js:781, :809 e :1249.

**Causa:** documento sincronizado passa por replaceState/renderAll; frame.id, block.id e mobileWidth entram em innerHTML sem encoding por contexto.

**Evidência/reprodução:** o JS real em VM produz img/onerror inofensivo a partir desses campos; texto comum do bloco é escapado como contraprova. A05 fornece escrita anônima da fonte compartilhada. Ver frontend-operacao.test.ts.

**Impacto/limites:** marcação persistente com caminho plausível de XSS no origin do Kanban. A VM captura HTML, sem executar eventos DOM; execução JavaScript em browser não foi observada. Não foi alegado roubo de cookie HttpOnly.

**Correção e regressão:** validar IDs/números, construir DOM seguro e codificar todos os atributos. Autenticação de A05 é correção separada. Browser isolado deve confirmar que nenhum campo cria tags/handlers.

### A07 — P2: eventos repetidos/antigos corrompem vigência

**Fonte:** main/src/lib/asaas-billing.ts:14 e :46; main/src/app/api/webhooks/asaas/route.ts:17.

**Causa:** eventId não é persistido e entitlement não é projetado por competência. markPaid troca startsAt/endsAt; markUnpaid degrada toda a assinatura.

**Evidência/reprodução:** em main/PR11, replay sem dueDate estende prazo; evento antigo overdue/deleted/refunded derruba renovação recente; confirmação antiga encurta endsAt ou reativa cancelamento/reembolso.

**Limites:** duplicata com mesma dueDate mantém endsAt, embora regrave. Token válido continua necessário; não é webhook público sem autenticação.

**Correção/regressão:** inbox com eventId único, ledger por paymentId/competência e projeção determinística. Permutações/duplicatas devem convergir sem afetar competência nova. Testes: backend-financial.test.ts.

### A08 — P2: webhook antecipado é perdido

**Fonte:** main/src/lib/asaas-billing.ts:47; main/src/app/api/webhooks/asaas/route.ts:23.

**Evidência:** evento válido chega antes da gravação do ID; helper retorna null e rota responde 200 sem persistência/replay. Conta pode continuar bloqueada mesmo após pagamento. Reproduzido em main e PR11.

**Limites:** exige evento legítimo autenticado nesse intervalo. Há recuperação parcial para linhas com providerPaymentId.

**Correção/regressão:** persistir evento antes do ACK, correlacionar referência externa e reprocessar após criar vínculo. Evento antes/durante/depois do commit deve produzir o mesmo resultado. Teste: backend-financial.test.ts.

### A09 — P2: recuperação de cobranças é incompleta

**Fonte:** main/src/app/api/plano/status/route.ts:12; main/src/app/api/plano/pix/route.ts:47; main/src/lib/asaas.ts:174; PR11/src/lib/asaas-checkout.ts:13.

**Evidência:** pending sem paymentId não consulta cobrança; active com endsAt vencido ignora reconciliação; Pix vencido insiste no primeiro QR; chargeback não altera acesso ativo. PR11 deixa cartão negado/past_due como checkout pendente sem nova tentativa/troca.

**Impacto/limites:** cliente preso ou acesso mantido após disputa. Pagamento atrasado com dueDate antiga fica bloqueado pela soma de 35 dias; a regra comercial correta precisa decisão explícita.

**Correção/regressão:** máquina de estados por cobrança/assinatura, lookup por subscription/referência, recuperação de recusa/vencimento e troca com cancelamento seguro. Cobrir atraso, disputa, estorno, cancelamento e falhas de rede. Teste: backend-financial.test.ts.

### A10 — P2: cache privado sobrevive ao logout

**Fonte:** main/public/sw.js:23; main/src/lib/session.ts:25.

**Evidência/reprodução:** worker guarda GET não API mesmo com no-store. VM devolve HTML de painel/detalhe e RSC após logout e falha de rede. APIs, POST e outro origin não são interceptados.

**Impacto/limites:** dados previamente exibidos acessíveis no mesmo perfil offline. Não é leitura remota arbitrária.

**Correção/regressão:** allowlist de assets públicos; excluir HTML/RSC privado/no-store e purgar caches antigos. Logout+offline nunca deve recuperar painel privado. Teste: security-regressions.test.ts.

### A11 — P2: lead público altera catálogo global de cidades

**Fonte:** main/src/lib/city.ts:11; main/src/app/api/publico/empresas/[slug]/pedir/route.ts:45.

**Causa/evidência:** slug normaliza acentos e helper atualiza nome canônico quando input tem mais acentos. Lead anônimo com variante forjada provoca UPDATE em cidade compartilhada no teste.

**Impacto/limites:** outras empresas veem catálogo corrompido. Exige empresa/estado válidos e slug correspondente; não permite SQL arbitrário.

**Correção/regressão:** separar referência pública de manutenção de catálogo; entrada anônima nunca renomeia cidade existente. Teste: public-boundaries.test.ts.

### A12 — P2: flood de leads e textos grandes

**Fonte:** main/src/app/api/publico/empresas/[slug]/pedir/route.ts:16 e :47; main/src/app/api/pedidos/route.ts:12.

**Evidência/reprodução:** rota aceita descrição de 2 MiB e 51 pedidos; lista take50 deixa pedido legítimo antigo inacessível nessa tela. Ele continua no banco: não foi apagado.

**Impacto/limites:** spam, uso de recursos e ocultação operacional. Limites do proxy podem restringir corpos maiores; nenhum stress foi feito em produção.

**Correção/regressão:** limite de corpo/campos, rate/quota por empresa/IP com privacidade, antispam e paginação. Excesso recebe 413/422/429 sem gravação; pedidos antigos permanecem alcançáveis. Teste: public-boundaries.test.ts.

### A13 — P2: aprovação perdida por resposta concorrente

**Fonte:** main/src/app/api/publico/orcamentos/[token]/responder/route.ts:31 e :53; visualizar/route.ts:15.

**Evidência:** duas chamadas leem sent; approve conclui e reject/revision/view concorrente sobrescreve estado terminal e registra eventos contraditórios.

**Impacto/limites:** proposta aceita passa a recusada/em ajuste/visualizada. Requer link público; sequencial após aprovação retorna 409 corretamente.

**Correção/regressão:** compare-and-swap de status/versão e evento na mesma transação. Corridas devem preservar decisão válida e retornar conflito ao perdedor; visualizar não rebaixa terminal. Teste: public-boundaries.test.ts.

### A14 — P2: login CSRF

**Fonte:** main/src/app/api/auth/login/route.ts:6 e :22.

**Causa/evidência:** request.json aceita text/plain sem validar origem. Corpo compatível com form cross-site, credenciais de atacante e campo extra ignorado recebe 200 e cria cookie na fixture.

**Impacto/limites:** vítima pode inserir dados na conta do atacante. Não obtém diretamente senha da vítima. Aceitação de cookie em navegação real não foi testada; SameSite=Lax não valida origem da criação de sessão. Senha incorreta não emite sessão.

**Correção/regressão:** exigir JSON e origem/CSRF apropriados; cross-site/text/plain devem falhar sem Set-Cookie, mantendo login legítimo. Teste: public-boundaries.test.ts.

### A15 — P2: senha de um caractere no cadastro

**Fonte:** main/src/lib/password-rules.ts:37; main/src/lib/registration.ts:54; tests/auth2.test.ts:107.

**Evidência:** regra exige apenas conteúdo não vazio até limite bcrypt; teste existente aceita senha de um caractere. A função forte usada em outro fluxo não protege cadastro.

**Impacto/limites:** senha trivial pode ser adivinhada nas primeiras tentativas. É escolha deliberada de produto apresentada como risco. Bcrypt e rate limit existem.

**Correção/regressão:** unificar política adequada de cadastro/redefinição e bloquear senhas comuns; curta/comum deve falhar sem criar usuário, forte deve funcionar.

### A16 — P2: sincronização perde edições concorrentes

**Fonte:** operacao/sync.js:120.

**Evidência:** A/B partem da mesma revisão; A grava edit-A e B grava edit-B. Upsert integral de B remove edit-A sem conflito. Revision não participa da condição de escrita.

**Impacto/limites:** tarefa desaparece apesar de sincronização indicar sucesso. Incidência real não medida. Autoria forjada pertence também à fronteira A05.

**Correção/regressão:** versão otimista com conflito/merge ou operações por entidade. Ambos os editores preservam alterações ou recebem conflito recuperável. Teste: frontend-operacao.test.ts.

### A17 — P2: defaults futuros fora do hardening PR7

**Fonte:** PR7/docs/security/manual/2026-10-15-hardening-public-prisma.sql:109.

**Causa/evidência:** revoga grants de tabelas/sequências atuais, sem corrigir default privileges dos criadores. Após hardening no banco com defaults inseguros, nova audit_future_model herdou SELECT anon e nasceu sem RLS.

**Impacto/limites:** migration futura reabre acesso. Não invalida proteção das tabelas atuais/compatibilidade Prisma. Defaults reais completos por owner ainda exigem inventário.

**Correção/regressão:** ALTER DEFAULT PRIVILEGES dos criadores corretos e gate dinâmico pós-migration. Novas tabelas/sequências de cada owner devem nascer privadas. Teste: rls-local.ts; tabela de prova removida localmente.

### A18 — P2: SVG alcança parser com advisory

**Fonte:** main/src/lib/storage.ts:37 e :91; versão Sharp em package-lock.json.

**Evidência/reprodução:** aplicação real local aceita SVG retangular inofensivo nomeado PNG/MIME image/png e gera WebP. O MIME declarado não impede content sniffing de Sharp 0.35.4. Assertion 25 de journey-local.mts.

**Impacto/limites:** input do prestador alcança parser SVG nativo na faixa do GHSA-wq5f-xc86-pv6w. Não foi usado exploit de memória/RCE. Linux/libc/PIE e biblioteca nativa efetiva da Vercel não foram comprovados. P2 reflete exposição confirmada com impacto final condicional.

**Correção/regressão:** atualizar Sharp para versão corrigida compatível, validar runtime nativo e bloquear SVG quando desnecessário. SVG declarado PNG deve ser recusado antes da decodificação SVG; imagens válidas continuam funcionando no Linux de deploy.

### A19 — P2: referências de fotos legadas sem arquivo

**Fonte:** main/src/components/company-gallery.tsx:28; main/src/lib/storage.ts:154; PR10.

**Causa/evidência:** galeria renderiza photo.path diretamente. Referência /uploads no banco não reconstrói arquivo ausente do disco do deploy. Main não tem substituição individual; PR10 adiciona filtro e reenvio preservando a row.

**Impacto/limites:** imagem quebrada e reenvio pelo prestador. Não se apurou quantidade real de arquivos perdidos nem se leu dado privado de produção. Sem backup/original, PR10 não recupera pixels.

**Correção/regressão:** concluir PR10 e comunicar reenvio; inventariar referências e restaurar somente de originais/backups. Cobrir galeria cheia, identidade/legenda/ordem, ownership, conflito e limpeza. Teste: frontend-operacao.test.ts.

### A20 — P3: lint não é gate limpo

**Fonte:** main/src/components/send-whatsapp-button.tsx:40; Control/src/components/template-reviewer.tsx:697 e src/lib/queries.ts:3.

**Evidência:** main tem um erro e um warning; Control dois erros. PR8 tem zero erros e um warning. Builds passaram: falha de lint não prova indisponibilidade runtime.

**Correção/regressão:** integrar PR8 e corrigir os dois erros do Control mantendo regras. Exigir exit0 de lint/typecheck/build. Harnesses da auditoria foram ajustados e seu lint isolado passou.

### A21 — P3: JWT anterior sobrevive no mesmo segundo

**Fonte:** main/src/lib/session-token.ts:44; main/src/lib/session.ts:54.

**Evidência:** iat em segundos comparado com floor(passwordChangedAt/1000) aceita JWT emitido milissegundos antes da troca. JWT real e getSessionUser real confirmam. Segundo anterior é negado.

**Impacto/limites:** sessão prévia sobrevive à revogação; exige possuir JWT válido emitido nessa janela estreita. Não permite falsificar assinatura.

**Correção/regressão:** versão de sessão incrementada atomicamente; todo token anterior à troca, inclusive no mesmo segundo, deve falhar. Teste: security-regressions.test.ts.

### A22 — P3: health público amplifica custo

**Fonte:** Control/src/app/api/health/route.ts:4; src/lib/health.ts:18.

**Evidência:** três GET anônimos provocam seis pings privilegiados no mock; chamada Asaas não tem deadline próprio. Resposta não expõe chave nem dados retornados.

**Impacto/limites:** quota/latência sob volume; integração deve estar configurada. Indisponibilidade real não comprovada.

**Correção/regressão:** liveness público barato separado de readiness autenticado/cacheado, com rate e timeout. Liveness repetido não deve consultar provedores. Teste: frontend-operacao.test.ts.

### A23 — P3: documentação operacional divergente

**Fonte:** main/README.md:8; main/docs/SUPPORT_RUNBOOK.md:46 e :72; migration 20261007193000.

**Evidência:** README diz MySQL/WAMP embora datasource seja PostgreSQL; runbook mantém pressupostos owner/BYPASSRLS sem política, diferentes das políticas server-role e roles NONBYPASSRLS observadas.

**Impacto/limites:** orientação errada a operadores; nenhum procedimento destrutivo desses documentos foi executado.

**Correção/regressão:** atualizar stack e fonte de verdade, pré-condições, backup/smoke/rollback por ambiente; operador deve conseguir seguir runbook em banco descartável sem depender de bypass na role da aplicação.

## Asaas: evidências complementares e contrato

Os 46 cenários financeiros cobrem main e PR11, criação/pendência/recusa, Pix gerado/pago/vencido, concorrência, timeout, renovação, atraso, cancelamento, reembolso, disputa e troca. Há controles positivos: webhook sem token é negado, conta isenta é preservada, conta vencida recebe 402, Pix pendente não libera plano e pagamento confirmado válido libera acesso.

Um payload autenticado de fixture com value/customer divergentes e R$0,01 também ativou plano integral. Não foi demonstrado que atacante externo consegue produzir tal evento com segredo válido. É gate de associação e reconciliação, sem nova vulnerabilidade pública contabilizada.

endsAt usa dueDate +35 dias ou agora +35 dias. A competência e a regra de pagamento atrasado precisam decisão de negócio explícita, além da correção técnica de ordem/idempotência.

A [documentação Asaas de eventos](https://docs.asaas.com/docs/webhook-para-cobrancas) distingue confirmação, recebimento, recusa e chargeback. A [FAQ de assinaturas](https://docs.asaas.com/docs/faq-assinaturas) descreve a recorrência. Criar assinatura não é prova suficiente de quitação. Não foi pressuposto header genérico de idempotência sem contrato do endpoint.

## Jornada, PDF e limites de UX

| Etapa | Evidência efetiva | Limite |
| --- | --- | --- |
| Cadastro/login | HTTP real, conta telefônica fictícia, sessão e novo login | Resend/e-mail somente mocks |
| Empresa | Onboarding real, trial de usuário não isento | Sem DNS/domínio customizado real |
| Vitrine/serviço | HTML com empresa e serviço persistido | Sem homologação visual/mobile |
| Foto | Sharp real, Storage HTTP mock loopback, GET do objeto e persistência | Storage Supabase real não acionado |
| Pedido | Lead público, fila do prestador e conversão transacional | Antispam é A12 |
| Proposta | 2×R$100=R$200, persistência, eventos e aprovação | Corridas separadas em mocks |
| PDF | PDF real, extração do texto e renderização inspecionada | Uma fixture, não todos os moldes |
| Compartilhamento | wa.me preparado e enviado marcado | Nenhuma mensagem transmitida |
| Plano | Trial e bloqueio por vencimento, billing em mocks | Asaas real/sandbox não acionado |

O PDF de 53.983 bytes contém cliente, serviço, subtotal/total R$200 e Pix. A página renderizada foi inspecionada sem cortes/sobreposição nessa amostra. Evidências em evidencias/proposta-ficticia.pdf, .txt e .png.

Computer Use encerrou a tentativa por não conseguir determinar a URL atual do browser com confiança suficiente para aplicar a política. Não houve screenshot de defeito nem automação de UI posterior. O PNG do PDF é renderização de documento, não screenshot do app.

Não se certificou dispositivo físico, leitor de tela, foco/teclado reais, áudio/gestos do Dock no browser, refresh de formulário em andamento, geolocalização, Core Web Vitals ou carga. GET após escrita comprova persistência servidor, sem comprovar todos os estados de formulário no navegador.

## Controles e hipóteses não elevadas a bugs

- APIs privadas principais derivam empresa da sessão e verificam ownership; os testes PR10 negam sessão ausente/outro tenant antes do upload.
- Catálogos, busca, métricas e link de proposta são públicos por desenho. A falha específica deve ser demonstrada, não inferida do nome público.
- /api/plano/ativar retorna 410. Isenção dos IDs internos 1/2 é codificada; não concede ADMIN no cadastro público.
- /api/admin/ramo exige admin; gateway /api/internal/control exige segredo; suporte Control usa sessão do operador e proxy com validações.
- Reset tem token aleatório, hash, expiração/consumo; bcrypt e rate limits existem. A02/A15/A21 são falhas específicas.
- Não foi reproduzida SQL injection. Prisma parametrizado/queryRaw por template foram observados; isso não é prova de ausência global.
- Prefixos/remoção de assets limitam caminhos; não foi demonstrada travessia arbitrária ou SSRF por imagem. Reverse geocoding usa host fixo.
- React escapa texto nos caminhos de suporte testados; não protege innerHTML do Kanban.
- Decoder de sessão aceita purpose handoff, mas não se encontrou emissão atual ao atacante; expiração real de dois minutos permanece. Não contado como bypass de 30 dias.
- Chave publicável Supabase, IDs e nomes de env não foram classificados como segredos. Nenhuma credencial privada foi incluída.

## Dependências, operação e cobertura

npm audit --omit=dev encontrou 7 pacotes vulneráveis no main (1 critical/6 high) e 7 no Control (7 high). São pacotes, não explorações comprovadas. JSONs originais estão em tests/dependencies-*.json.

Next 16.3.5 coincide com [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), cuja condição envolve ImageResponse e SVG não confiável em Node. As imagens OG inspecionadas usam texto React/estilos definidos; não se demonstrou SVG arbitrário nesses caminhos. Atualizar é recomendado; RCE não foi contado somente por versão.

Sharp 0.35.4 tem [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), com exposição delimitada em A18. Advisories Prisma/config/transitivos exigem trace de uso antes de alegar exploit runtime. Atualizar em branch própria e repetir regressões de imagens/OG.

Consultas de dashboard/filas usam agregações e limites. Não houve EXPLAIN ANALYZE com cardinalidade real, saturação, restore de backup ou comprovação de RPO/RTO. Não afirmar que backup/índices estão adequados só pelo schema. Exigir restauração em ambiente descartável e telemetria de eventos financeiros órfãos.

Main tem 48 arquivos route.ts de API: grupos CRM/galeria/pedidos/propostas/PDF/setup por sessão e empresa; mutações comerciais por plano; auth/reset/verify como entradas públicas; handoff por token específico; catálogos/busca públicos; proposta por capability; webhook/gateway por segredo; suporte por sessão e ownership. Inventário por nomes de guards foi seguido de leitura dos casos sem guard óbvio; busca textual sozinha não prova autorização.

Control tem três APIs: login, health público e suporte proxy por operador. Kanban não tem backend próprio; RLS é a fronteira efetiva. Não foi alegada revisão integral de todas as ações visuais e dependências.

As recomendações seguem os controles descritos nas [orientações oficiais Supabase de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api). RLS ALL true para servidor não substitui isolamento de tenant na aplicação.

Ver MATRIZ_MERGE.md, PLANO_CORRECOES.md, RESULTADOS_TESTES.md e RESUMO_ADRIEL.md. A entrega é investigação com cobertura declarada, sem implementação das correções.

## Registro canônico de segurança

Scan 0368249f-52fd-4fbb-99e4-9cbc301dde71, concluído sobre o snapshot imutável dac04180a2d7a3ef4379e41029abbe0ed5517170. O registro de segurança da aplicação principal contém 15 achados (1 critical, 3 high, 10 medium, 1 low); é subconjunto dos 23 achados de engenharia dos três repositórios, não outra contagem concorrente. Cobertura de fonte parcial e perguntas abertas foram preservadas. O aviso de mudança de working tree decorre dos testes/relatórios adicionados; o resultado continua vinculado ao snapshot original, sem alteração de src.

Medição de uso retornada pelo plugin: cobertura parcial, 25058228 tokens totais, 24929379 de entrada e 23796864 de entrada em cache. Há um thread sem medição (rollout_unavailable); esses números não representam medição completa nem estimativa de custo.
