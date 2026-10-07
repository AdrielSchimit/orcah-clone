# Runbook — Deploy do suporte (Issue #5)

> **Não executar sem aprovação humana.** Nada deste documento foi executado em produção.
> PRs: `feat/mascote-support-chat → main` (este repo) e `feat/support-inbox → develop` (orcah-control).

Ordem obrigatória: **migration → main → Control.** A migration é aditiva e o código atual da main não usa as tabelas novas, então aplicá-la antes do deploy não afeta produção. O Control novo depende da main nova (ação `support` e busca de nomes por `ids` no Asaas), então ele vai por último.

## Pré-requisitos (checar antes do Passo 1)

- [ ] Os dois PRs foram revisados e aprovados por uma pessoa.
- [ ] O ensaio local da migration **com o arquivo final** passou (veja "Ensaio local" no fim). O banco de QA do Codex foi migrado com uma versão anterior do arquivo, sem `support_threads_cycle_check`.
- [ ] O build da Vercel da main **não** roda `prisma migrate deploy` (Settings → Build Command = `npm run build`).
- [ ] O `CONTROL_INTERNAL_SECRET` é idêntico na main e no Control e tem ≥ 32 bytes. Essa regra já existia antes deste PR; se o Control funciona hoje, ela já está cumprida.
- [ ] Há uma janela de baixo tráfego; Adriel e uma conta fictícia de prestador estão disponíveis para o smoke test.

## Passo 1 — Backup / confirmação do banco

1. No Supabase: Database → Backups. Confirme que existe um backup/PITR recente, ou gere um backup manual.
2. Confirme o papel usado pela main, com `DATABASE_URL` e `DIRECT_URL` (somente leitura, no SQL Editor):

```sql
SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;
SELECT to_regclass('public.support_threads'), to_regclass('public.support_messages');
```

Resultado esperado:
- última migration = a anterior a `20261007160000_support_chat`;
- as duas tabelas `support_*` retornam `NULL`.

Se `support_threads` já existir, **pare** e investigue.

## Passo 2 — Aplicar a migration

Rode de uma máquina confiável, com `DIRECT_URL` de produção carregada apenas na sessão do terminal. Não grave em arquivo.

```bash
npx prisma migrate deploy
```

Esperado: `Applying migration 20261007160000_support_chat` e nenhuma outra migration pendente.

A migration:
- cria 3 enums, 2 tabelas, 7 índices e 3 FKs com `ON DELETE CASCADE` para `companies`, `users` e `support_threads`;
- cria 3 CHECKs: tamanho de 1–2000 caracteres, par HUMAN/operador e timestamps do ciclo;
- habilita RLS sem nenhuma policy;
- faz `REVOKE ALL` de PUBLIC, anon e authenticated.

Ela não altera nem apaga nada que já existe.

## Passo 3 — Validar tabelas, índices e RLS

```sql
SELECT relname, relrowsecurity, relforcerowsecurity, pg_get_userbyid(relowner) AS owner
FROM pg_class WHERE relname IN ('support_threads','support_messages');
-- esperado: relrowsecurity = true; owner = papel do Passo 1

SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_name IN ('support_threads','support_messages') ORDER BY grantee;
-- esperado: nenhuma linha para PUBLIC, anon ou authenticated

SELECT indexname FROM pg_indexes WHERE tablename IN ('support_threads','support_messages') ORDER BY 1;
-- esperado: 7 índices + 2 pkeys

SELECT conname FROM pg_constraint
WHERE conrelid IN ('support_threads'::regclass, 'support_messages'::regclass) ORDER BY 1;
-- esperado: 3 checks, 3 fkeys, 2 pkeys
```

Teste do Data API pelo browser/anon: `GET https://<projeto>.supabase.co/rest/v1/support_threads` com a anon key deve retornar **401/403 ou lista vazia**, nunca dados.

Sobre o papel da main:
- Se ele **for o dono** das tabelas, opera normalmente (o dono não é afetado por RLS sem `FORCE`).
- Se **não for o dono** e não tiver `BYPASSRLS`, a main vê 0 linhas. Nesse caso **pare**: é preciso decidir entre transferir a propriedade ou criar policies. Isso exige aprovação.

`service_role` continua com os grants padrão do Supabase. Isso é aceitável porque é um papel só de servidor, mas a chave **não** pode estar no Control.

## Passo 4 — Env da main (Vercel, Production)

| Variável | Valor |
|---|---|
| `CONTROL_INTERNAL_SECRET` | já existe; igual ao do Control, ≥ 32 bytes |
| `OPENAI_API_KEY` | **opcional**; deixe vazio para lançar só com o RAG local |
| `SUPPORT_AI_MODEL` | **opcional**; só tem efeito junto com a chave |

Nenhuma variável `NEXT_PUBLIC_*` nova.

## Passo 5 — Deploy da main

Faça o merge do PR na `main` e espere o deploy de Production ficar `Ready`. Anote o ID do deployment anterior para o rollback.

## Passo 6 — Smoke test da main

- `GET /api/support/thread` sem cookie → 401.
- `POST /api/internal/control` sem header → 401.
- Faça login com a conta fictícia → o mascote abre → "Como criar orçamento?" → resposta com "Novo orçamento".
- Nos Runtime Logs, nenhuma linha `[support] request failed`.

## Passo 7 — Env do Control

| Variável | Valor |
|---|---|
| `CONTROL_APP_URL` | origem HTTPS da main de produção, sem path (ex.: `https://orcah-clone.vercel.app`) |
| `CONTROL_INTERNAL_SECRET` | o mesmo da main |
| `CONTROL_AUTH_SECRET`, `CONTROL_ADMIN_*` | os que já existem |

Confirme que **não** existem `DATABASE_URL`, `DIRECT_URL` nem service role do Supabase no projeto Vercel do Control. Se existirem, remova (com aprovação).

## Passo 8 — Deploy do Control

Faça o merge do PR na `develop`, depois siga o fluxo atual de promoção do Control para produção.

## Passo 9 — Smoke test Adriel ↔ conta de teste

Use uma conta fictícia, nunca um prestador real.

1. O prestador abre o mascote.
2. Envia "Como criar orçamento?".
3. Recebe a resposta do assistente.
4. Recarrega a página → o histórico continua lá.
5. Toca em "Falar com uma pessoa" → vê "Na fila para atendimento".
6. O Control → Suporte → "Na fila" mostra a conversa com o contexto da empresa.
7. Adriel clica "Assumir atendimento".
8. O prestador vê "Atendimento com Adriel" em até ~2 s.
9. Adriel responde.
10. O prestador recebe a mensagem, com o badge se o chat estiver fechado.
11. Adriel clica "Resolver".
12. O prestador vê "Atendimento resolvido".
13. O prestador toca em "Voltar ao assistente" → o status volta a "Assistente virtual" e o mascote responde de novo.

Extra: o César tenta assumir a mesma conversa ao mesmo tempo → recebe 409 "Outro operador está atendendo".

## Passo 10 — Monitorar (primeiras 24 h)

- Runtime Logs da main: `[support] request failed` e `[control-gateway] request failed`. Os logs só trazem o nome do erro, nunca o conteúdo.
- Status 429 frequente → os limites estão apertados demais para o uso real.
- Supabase → Database → conexões e CPU. A estimativa de polling está em `docs/SUPPORT_REVIEW.md`.
- Se a carga subir: aumente o intervalo em `supportPollInterval` (`src/lib/support/use-support-thread.ts`).

## Rollback

| Situação | Ação |
|---|---|
| Bug na UI/API da main | Vercel → main → promover o deployment anterior (Instant Rollback). As tabelas podem ficar, porque o código antigo as ignora. |
| Bug no Control | Promover o deployment anterior do Control. A main nova continua compatível com o Control antigo. |
| Migration com problema **antes** de qualquer dado real | Reverter o código primeiro e depois rodar o SQL abaixo, com aprovação. |
| Migration com problema **depois** de conversas reais | Não apagar. Desligar o uso revertendo o código e decidir com backup em mãos. |

SQL de remoção. É **destrutivo** e apaga as conversas. Use só com aprovação explícita:

```sql
BEGIN;
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS support_threads;
DROP TYPE IF EXISTS "SupportSenderType";
DROP TYPE IF EXISTS "SupportPriority";
DROP TYPE IF EXISTS "SupportStatus";
DELETE FROM _prisma_migrations WHERE migration_name = '20261007160000_support_chat';
COMMIT;
```

## Ensaio local (pré-requisito)

Só no Postgres local descartável `127.0.0.1:55439/orcah_support_test`. Os scripts recusam qualquer outro host.

```bash
SUPPORT_TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:55439/orcah_support_test" npx tsx scripts/support-local-migrate.ts
```

```bash
SUPPORT_TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:55439/orcah_support_test" npm run test:support:integration
```

O primeiro comando recria o banco local, aplica a cadeia inteira de migrations duas vezes (a segunda sem pendências) e compara com o `schema.prisma`. O segundo sobe main e Control nas portas 3100/3101. Se já houver servidores locais nessas portas, use `SUPPORT_TEST_ATTACH_SERVERS=1`.
