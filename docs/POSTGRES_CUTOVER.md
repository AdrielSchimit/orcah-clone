# ORÇAH — Cutover MySQL/Railway → PostgreSQL/Supabase + Vercel

## Estado atual
- Produção atual: Railway + MySQL.
- Destino: Vercel + Prisma + Supabase PostgreSQL.
- Branch de teste: `develop`.
- `develop` já usa `provider = "postgresql"` e `DIRECT_URL`.
- CI da `develop`: Prisma validate, typecheck, lint e build.
- Supabase novo: schema + seed carregados.
- Produção não deve ser alterada antes do smoke test.

## Segredos necessários
### Vercel Preview
- `DATABASE_URL`: Supabase Transaction pooler
- `DIRECT_URL`: Supabase Session pooler / 5432
- `AUTH_SECRET`: segredo longo e aleatório
- `ADMIN_EMAILS`: `schimitadriel100@gmail.com,cesar.turmina1@gmail.com`

### Migração local
- `SOURCE_DATABASE_URL`: MySQL Railway atual
- `TARGET_DATABASE_URL`: Supabase PostgreSQL
- Nunca commitar nenhum desses valores.

## Ordem de execução
1. Rodar `npm ci`.
2. Rodar `npm run db:validate`.
3. Rodar `npm run typecheck`.
4. Rodar `npm run lint`.
5. Rodar `npm run build`.
6. Configurar Vercel Preview com as variáveis acima.
7. Marcar a baseline Prisma no Supabase:
   `npx prisma migrate resolve --applied 20260924194650_baseline_orcah_postgres`
8. Rodar `npx prisma migrate status`.
9. Rodar migração de dados preservando IDs e hashes.
10. Conferir contagens origem/destino.
11. Smoke test no Preview:
   - /cadastro
   - /login
   - /onboarding
   - /painel
   - criar cliente
   - criar orçamento
   - abrir link público
   - aprovar/recusar/pedir alteração
12. Só depois repetir envs em Vercel Production.
13. Fazer novo smoke test em Production.
14. Apontar `orcah.com.br` para Vercel.
15. Manter Railway/MySQL como rollback por alguns dias.
16. Remover serviço temporário de migração após validação.

## Critério de GO
- Build verde.
- Prisma migration status limpo.
- Contagens conferidas.
- Login existente funciona.
- Novo cadastro funciona.
- Onboarding funciona.
- Cliente e orçamento funcionam.
- Link público funciona.
- Aprovação funciona.
- Sem erros novos de Prisma nos logs da Vercel.

## Critério de ABORT
- Contagens divergentes.
- Hash de senha não preservado.
- Erro de FK.
- Preview não autentica.
- Link público falha.
- Migrations pendentes inesperadas.

## Rollback
Enquanto o Railway/MySQL não for desligado:
- manter `main` e produção antiga disponíveis;
- não apagar banco antigo;
- em caso de falha, restaurar domínio/variáveis para o ambiente anterior.
