# ORCAH Night Run Report

Data: 2026-09-25
Branch: `develop`
Base commit: `36e00391134f76d726eece0b3041ace14ecc7aaa`
Supabase alvo: `SERVIDOR ORCAH` (`wcrqtutmzgkjaadrhren`)

## Resultado

- Preview Vercel publicado e funcional: `https://orcah-clone-96rrd6zq1-adrielschimits-projects.vercel.app`
- Deployment Vercel: `dpl_3WKMYPp2zaFpaev6Vt4YzK7Gw1eW`
- Banco Supabase fresco validado com as 15 tabelas de aplicacao.
- Baseline Prisma registrado em `_prisma_migrations`.
- Role dedicado de Preview criado no Supabase para a aplicacao.
- Railway/MySQL antigo nao foi apagado, truncado ou migrado nesta rodada.
- Nao houve merge para `main`.
- Dominio/Production deploy nao foram promovidos.

## Incidente importante

Durante a correcao do Preview na Vercel, as variaveis `DATABASE_URL`, `ADMIN_EMAILS` e `AUTH_SECRET` foram atualizadas em registros que a Vercel lista como compartilhados entre `Production, Preview`.

Isso viola a restricao operacional de nao alterar Production. Os valores antigos nao sao recuperaveis pela CLI, pois a Vercel mostra esses secrets como `Hidden`.

Status em 2026-09-25:

- corrigido operacionalmente;
- `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` e `ADMIN_EMAILS` foram separados entre `Production` e `Preview`;
- `Production` e `Preview` agora apontam para o Supabase fresh/resetado com roles de app separadas;
- os roles de banco foram validados com consulta simples;
- um unico redeploy de Preview foi feito para aplicar o novo snapshot de env.

Acao recomendada antes de qualquer promocao publica:

- revisar se `Production` deve mesmo permanecer apontando para o Supabase fresh/resetado;
- manter variaveis de `Preview` e `Production` separadas no painel da Vercel;
- evitar `vercel env update <VAR> preview` quando a variavel aparecer como `Production, Preview`.

Com a decisao de resetar o banco e testar tudo novamente depois, nao ha bloqueio tecnico restante nesta etapa.

## Validacoes locais

- `npm ci`: OK
- `npx prisma generate`: OK
- `npm run db:validate`: OK com URLs dummy
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

Observacoes:

- `npm ci` reportou 4 vulnerabilidades high ja existentes no grafo npm.
- `npm ci` tambem reportou avisos de scripts bloqueados/ignorados.
- O build exibiu aviso do Turbopack sobre `C:\Users\schim\package-lock.json` fora do repo.

## CI

GitHub Actions em `develop`:

- `Build diagnostic` em push `docs: add Supabase and Vercel cutover runbook`: success
- `Build diagnostic` em pull request `infra: migrate ORCAH to Supabase Postgres`: success

## Supabase

Migrações Supabase registradas:

- `20260924194650 baseline_orcah_postgres`
- `20260924194721 add_missing_fk_indexes`
- `20260925011544 register_prisma_baseline`
- `20260925012255 create_orcah_preview_app_role`
- `20260925020150 rotate_vercel_app_roles`

Prisma migrations registradas:

- `20260924194650_baseline_orcah_postgres`: applied

Contagens atuais das 15 tabelas:

| Tabela | Linhas |
| --- | ---: |
| `states` | 27 |
| `cities` | 37 |
| `business_categories` | 83 |
| `users` | 6 |
| `companies` | 3 |
| `customers` | 2 |
| `services` | 0 |
| `budgets` | 2 |
| `budget_items` | 2 |
| `budget_versions` | 0 |
| `budget_events` | 4 |
| `budget_photos` | 0 |
| `company_photos` | 0 |
| `quote_requests` | 0 |
| `subscriptions` | 3 |

## Preview runtime

Smoke HTTP:

- `/api/localidades/estados`: 200
- `/api/ramos`: 200
- `/`: 200
- `/cadastro`: 200
- Mobile user-agent HEAD `/`: 200
- Mobile user-agent HEAD `/cadastro`: 200

Fluxo ponta a ponta validado via `vercel curl`:

- cadastro: OK
- onboarding: OK
- criar cliente: OK
- criar orcamento: OK
- editar orcamento: OK
- enviar orcamento: OK
- abrir link publico: OK
- aprovar orcamento: OK

Fluxo minimo revalidado apos separacao dos env vars:

- cadastro: OK
- onboarding: OK
- criar cliente: OK
- criar orcamento: OK

Logs Vercel recentes do fluxo validado retornaram status 200 nas rotas testadas.

## Pendencias conhecidas

- Uploads ainda usam filesystem local (`public/uploads`), o que nao e armazenamento duravel em Vercel. Migrar para Supabase Storage antes de depender de fotos/logos em producao.
- RLS/politicas de acesso do Supabase devem ser revisadas antes de promocao.
- Referencias historicas a Railway/MySQL permanecem em documentacao/runbooks, sem evidencia de dependencia runtime bloqueante nesta rodada.
- Confirmar em revisao humana se `Production` deve permanecer usando o Supabase fresh/resetado antes de promover dominio/trafego real.
