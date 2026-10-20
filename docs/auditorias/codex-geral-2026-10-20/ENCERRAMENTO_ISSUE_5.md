# Encerramento da revisão do MVP Issue #5

Verificação de encerramento em 20/10/2026, após entrega da auditoria geral. Este adendo resolve a divergência documental do ensaio da migration; não altera código de produto nem aprova produção.

## Veredito

**APROVADO PARA MIGRATION REVIEW no escopo do suporte.** O bloqueio técnico de ensaio do arquivo final, ainda descrito no documento histórico SUPPORT_REVIEW.md, foi encerrado com execução local real nesta data. A revisão e seus artefatos estão entregues.

**Produção permanece BLOQUEADA pelos achados da auditoria geral.** Aprovação de uma migration de suporte não aprova o banco inteiro, cobrança, cadastro, Kanban ou isolamento de ambientes. Ver RELATORIO_COMPLETO.md e PLANO_CORRECOES.md.

## Estado autoritativo das entregas

| Entrega | Head revista | Estado remoto confirmado em 20/10 |
| --- | --- | --- |
| [App PR #6](https://github.com/AdrielSchimit/orcah-clone/pull/6) | 047fecc37e3bc9b972bb3dc05fcb4a02a215cdb7 | MERGED por AdrielSchimit em 07/10, 18:46:32 UTC |
| [Control PR #1](https://github.com/AdrielSchimit/orcah-control/pull/1) | 760eeaa6ddfa48922ffea38e3baca3c71360565b | MERGED por AdrielSchimit em 07/10, 18:46:37 UTC |

Os PRs solicitados já haviam sido criados. Os merges foram ações externas da conta humana, não desta verificação. Não foram criados PRs duplicados nem feitos novos merges.

Fetch dos dois remotes confirmou main em dac0418 e develop Control em e375dca. As duas heads de feature são ancestrais dos destinos. Não se rebaseou uma entrega histórica já integrada, nem se sobrescreveu trabalho posterior.

Na revisão original, Control incorporou 0c2e76b, 7b1f9be e b1cc8ff no merge 58b598b. Main não tinha commits novos após 2511268 naquela revisão. Os commits entregues permanecem 047fecc e 760eeaa. Este encerramento só adiciona documentação/evidências na branch isolada codex/auditoria-geral-2026-10-20.

## Evidência nova do arquivo final

Arquivo: prisma/migrations/20261007160000_support_chat/migration.sql.

O objeto Git desse arquivo em feat/mascote-support-chat e origin/main é o mesmo: becc362f5cef6138b85d910164f75aad724470c1. O ensaio foi executado a partir do checkout exato da feature, em cluster novo de auditoria, exclusivamente 127.0.0.1:55439/orcah_support_test.

Comandos efetivamente concluídos:

    SUPPORT_TEST_DATABASE_URL=<URL local dedicada> node --import tsx scripts/support-local-migrate.ts
    SUPPORT_TEST_DATABASE_URL=<URL local dedicada> npm run test:support:integration

O script tem guard rígido de protocolo, host, porta, nome do banco e ausência de parâmetros. Recriou somente seu banco fictício e aplicou a cadeia inteira. Segundo migrate deploy: sem pendências. Prisma validate e migrate diff passaram. Os quatro índices extras anteriores da baseline foram preservados, sem executar SQL de diff.

Os CHECKs de atribuição e timestamps foram exercitados **instalados pela migration**, sem fallback de criação temporária para o ciclo. Seis estados temporais impossíveis receberam negação; tamanho e par HUMAN/operador também foram validados.

Logs: evidencias/issue5-migration-closeout.txt e issue5-integration-closeout.txt.

## Resultado da repetição final nas features

| Comando / evidência | App 047fecc | Control 760eeaa |
| --- | --- | --- |
| npm test | 265/265, zero falhas | 37/37, zero falhas |
| npm run typecheck | exit0 após build | exit0 após build |
| ESLint dos arquivos tocados existentes | exit0 | exit0 |
| npm run build | exit0, incluindo prisma generate | exit0 |
| Integração conjunta HTTP + PostgreSQL | 15 blocos PASS | Mesma integração; sem credenciais DB no processo Control |

A tentativa inicial de lint Control incluiu src/lib/db.ts, removido pela implementação; o comando de inventário foi corrigido para diff-filter=ACMR. A execução correta passou. Não foi defeito de produto nem ocultação de erro de lint.

Esses resultados são das features históricas, diferentes dos snapshots posteriores da auditoria geral. O lint completo desses snapshots posteriores continua com os achados A20. Não se substituiu um resultado pelo outro.

Logs de build/testes estão em evidencias/issue5-{main,control}-{tests,build}.txt. Eventuais espaços finais de texto podem ser normalizados para revisão Git; não se alteram conteúdo e contagens.

## Auditoria de conclusão por requisito

| Item do pedido original | Prova / resultado |
| --- | --- |
| 1. Refs e trabalho de terceiros | Fetch atual; ancestry confirmada; merge original de três commits Control em 58b598b; nenhum reset/rewrite |
| 2. Migration/schema | Cadeia completa e no-op, validate/diff, três enums, duas tabelas, sete índices secundários, três FKs CASCADE e três CHECKs |
| 3. Autorização do prestador | Integração A/B e testes de serviço: identidade de sessão, thread alheia negada, ações privilegiadas rejeitadas |
| 4. Control sem banco direto | Fluxo proxy/gateway; processo de integração com DATABASE_URL/DIRECT_URL vazios; dependências Prisma legadas sem uso runtime permanecem P3 documentado |
| 5. Segredo da ponte | Testes de ausência/erro/comprimento/timing-safe; redirect bloqueado; identidade do operador derivada da sessão |
| 6. Máquina de estados | Tabela no SUPPORT_REVIEW; claim concorrente produz 200/409; CHECKs reais negam estado impossível |
| 7. Idempotência | Unique de thread/sender/clientId, row lock e lease; retry/concorrência e chave com conteúdo divergente testados |
| 8. Polling | Suíte de transport/timers/abort/backoff e deltas; pausa oculta/offline; estimativa abaixo |
| 9. Limites | 15 mensagens/min prestador, 30 operador e 12 estados por thread; persistência PostgreSQL, 429 e falha fechada; leitura não bloqueada |
| 10. Privacidade RAG | Mock captura payload exato curado, sem pergunta/histórico/contatos; store:false e timeout/fallback testados |
| 11. Injection | Perguntas adversas sem ferramenta/segredo; texto livre não chega ao provider no caminho inspecionado |
| 12. Sem IA | Sete FAQs e handoff, provider desativado na integração e testes |
| 13. Prestador UX | Fonte, testes e evidência histórica review-prestador-mobile.jpg a 390 px revisados; não se alega novo ensaio de teclado físico |
| 14. Control UX | Evidência histórica desktop com nome/mensagem longos revisada; 100 conversas reais fictícias paginadas 60+40 na integração; mobile permanece aceite manual de rollout |
| 15. N+1 | Uma conversa: seis queries; 60: seis queries, medido pelo evento SQL Prisma |
| 16. Índices | Índices declarados presentes e EXPLAIN ANALYZE local capturado; planner pode usar outros índices/Seq Scan nesse volume |
| 17. Logs | Caminhos de suporte/gateway registrados por tipo de erro; sem payload livre/contato/segredo na instrumentação revisada |
| 18. Carga leve | 20 threads×50 históricos, mais 50 envios/50 polls, cinco clients; sem lacuna/duplicação; sem afirmar benchmark de escala ou ausência global de leak |
| 19. Suítes/builds | Tabela acima; integração repetida com o arquivo final |
| 20. Produção | Nenhum SQL remoto, env/deploy/merge ou cobrança executado nesta conclusão |
| 21. Dois PRs | #6 e #1 existem com heads corretas; integração humana posterior confirmada |
| 22. Deploy/rollback | Runbook histórico e ressalvas atuais abaixo; procedimentos não executados |
| 23. Smoke manual | Passo 9 do runbook cobre mascote→F5→fila→Adriel→resposta→resolver→bot |
| 24. Veredito/artefatos | Este adendo, revisão histórica, evidências, dois PRs e auditoria geral vinculados |

O aceite manual de UI/mobile e a autorização de produção são responsabilidades humanas ainda abertas; não são apresentados como aprovados. A conclusão é da revisão, com essas limitações explícitas.

## Migração e isolamento

Migration aditiva: não remove/altera tabelas de negócio anteriores. Usa o mecanismo padrão Prisma; não repetir o SQL manualmente contra banco já migrado.

RLS ativo e grants efetivos negados: 24 tentativas reais de CRUD por PUBLIC de teste/anon/authenticated falharam. Owner não-superuser operou; não-owner sem BYPASSRLS, mesmo com grants explícitos, viu zero linhas e teve INSERT negado. Três FKs CASCADE foram verificadas por remoção de User/Company dentro de rollback, sem órfãos.

Esses fatos descrevem a migration original. A cadeia posterior da main acrescentou políticas de servidor em 20261007193000; portanto a regra histórica “owner ou BYPASSRLS” não deve ser tomada como instrução universal do runtime atual. A auditoria geral validou ambas as roles NONBYPASSRLS na cadeia atual, sem demonstrar isolamento Preview/Production. Essa distinção deve entrar na revisão operacional antes de qualquer rollout.

## Desempenho observado e estimativa

Carga leve atual: p50 217 ms, p95 362 ms para envio+poll no ambiente local. Cinco clients, 20 históricos de 50 mensagens e inbox de 100 fixtures. Não equivale a medição em Vercel ou em mil usuários.

| Usuários ativos no painel | Fechado BOT/RESOLVED: 30 s | Aberto/QUEUED/HUMAN: 2 s |
| --- | ---: | ---: |
| 10 | 20 req/min | 300 req/min |
| 100 | 200 req/min | 3.000 req/min |
| 1.000 | 2.000 req/min | 30.000 req/min |

Oculto/offline: zero polling; operador com inbox e conversa aberta: cerca de 60 req/min. Backoff limita falhas até 30 s. São estimativas de intervalos, não capacidade comprovada.

Na execução atual, histórico usou Bitmap Index Scan no índice unique de mensagens e fila Seq Scan, ambos com sort. A evidência histórica de Index Only Scan não foi reapresentada como resultado atual. Não foram criados índices cegamente.

## Runbook e autorização humana

Documentos históricos:

- [Revisão do suporte](https://github.com/AdrielSchimit/orcah-clone/blob/047fecc37e3bc9b972bb3dc05fcb4a02a215cdb7/docs/SUPPORT_REVIEW.md).
- [Deploy e rollback](https://github.com/AdrielSchimit/orcah-clone/blob/047fecc37e3bc9b972bb3dc05fcb4a02a215cdb7/docs/SUPPORT_RUNBOOK.md).

Este adendo substitui a pendência de ensaio local daqueles documentos. **O runbook é histórico de primeira implantação; não executar cegamente em banco onde support_* já existe.** Não reaplicar arquivo nem remover tabelas para simular primeira instalação.

Para qualquer implantação futura: operador confirma backup/restore e migrations/ACLs atuais; revisa SQL e roles efetivas sem pressupor bypass; ensaia em clone isolado; confirma envs server-side e ausência de credenciais DB no Control; autoriza janela; segue migration→main→Control; executa smoke com conta fictícia e monitora erros. IA externa continua opcional.

Rollback preferencial é versão de aplicação compatível, preservando conversas. Dados reais não devem ser apagados; remoção de tabelas ou edição de histórico Prisma exige decisão explícita com backup e nunca foi executada aqui.

Ainda exigem decisão humana: contenção dos P0/P1 gerais, revisão/rollout de banco, isolamento de ambientes, backup restaurável, configuração de produção, aceite UI/mobile e eventual provider externo. Este encerramento não concede essa autorização.
