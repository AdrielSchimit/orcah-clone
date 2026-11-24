-- ORÇAH — proposta de hardening das tabelas privadas do Prisma
-- 2026-10-15 | Somente revisão. NÃO colocar em prisma/migrations.
-- NÃO executar em produção sem backup, teste Preview e aprovação do responsável.
-- Política operacional: todo acesso de navegador passa pelas rotas Next.js, nunca
-- diretamente pelo Supabase anon/authenticated para estas 21 tabelas.
-- O Kanban ops_api não está incluído nesta migration (projeto separado).
BEGIN;

DO $preflight$
DECLARE
  expected text[] := ARRAY[
    '_prisma_migrations',
    'assisted_setup_requests',
    'auth_attempts',
    'budget_events',
    'budget_items',
    'budget_photos',
    'budget_versions',
    'budgets',
    'business_categories',
    'cities',
    'companies',
    'company_page_daily_stats',
    'company_photos',
    'customers',
    'email_verification_tokens',
    'password_reset_tokens',
    'quote_requests',
    'services',
    'states',
    'subscriptions',
    'users'
  ];
  tab text;
  privilege_name text;
BEGIN
  IF to_regrole('orcah_production_app') IS NULL OR
     to_regrole('orcah_preview_app') IS NULL OR
     to_regrole('anon') IS NULL OR
     to_regrole('authenticated') IS NULL THEN
    RAISE EXCEPTION 'ORCAH: papéis esperados não existem; abortar sem alterar dados';
  END IF;

  IF (SELECT count(*) FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname = ANY(expected))
      <> array_length(expected,1) THEN
    RAISE EXCEPTION 'ORCAH: inventário de tabelas divergiu; revisar lista antes de aplicar';
  END IF;

  FOR tab IN SELECT unnest(expected)
  LOOP
    IF (SELECT pg_get_userbyid(c.relowner)
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname=tab) <> 'postgres' THEN
      RAISE EXCEPTION 'ORCAH: proprietário mudou em public.%; revisar', tab;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies
       WHERE schemaname='public' AND tablename=tab
         AND policyname <> 'orcah_server_roles_full') THEN
      RAISE EXCEPTION 'ORCAH: política preexistente em public.%; revisão manual necessária',tab;
    END IF;

    -- Garante que Prisma já dispõe dos acessos, antes de ativar RLS.
    FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE']
    LOOP
      IF NOT has_table_privilege('orcah_production_app',format('public.%I',tab),privilege_name)
         OR NOT has_table_privilege('orcah_preview_app',format('public.%I',tab),privilege_name) THEN
        RAISE EXCEPTION 'ORCAH: falta permissão % em public.% para papéis app',privilege_name,tab;
      END IF;
    END LOOP;
  END LOOP;
END
$preflight$;

-- Uma única transação: em caso de falha, nenhuma tabela deve ficar parcialmente protegida.
DO $harden$
DECLARE
  tab text;
  seq text;
BEGIN
  FOR tab IN
    SELECT unnest(ARRAY[
    '_prisma_migrations',
    'assisted_setup_requests',
    'auth_attempts',
    'budget_events',
    'budget_items',
    'budget_photos',
    'budget_versions',
    'budgets',
    'business_categories',
    'cities',
    'companies',
    'company_page_daily_stats',
    'company_photos',
    'customers',
    'email_verification_tokens',
    'password_reset_tokens',
    'quote_requests',
    'services',
    'states',
    'subscriptions',
    'users'
    ])
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
                   AND tablename=tab AND policyname='orcah_server_roles_full') THEN
      EXECUTE format(
        'CREATE POLICY orcah_server_roles_full ON public.%I FOR ALL TO orcah_production_app, orcah_preview_app USING (true) WITH CHECK (true)',
        tab
      );
    END IF;
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated',tab);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO orcah_production_app, orcah_preview_app',tab);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tab);
  END LOOP;

  -- Impede uso direto da sequência pelo papel público (mesmo quando tabelas são privadas).
  -- As sequências do app Prisma residem no schema public. Não altera schema ops_api.
  FOR seq IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='S'
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE public.%I FROM PUBLIC, anon, authenticated',seq);
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO orcah_production_app, orcah_preview_app',seq);
  END LOOP;
END
$harden$;

DO $verify$
DECLARE
  remaining int;
  app_broken int;
BEGIN
  SELECT count(*) INTO remaining
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND c.relname = ANY(ARRAY[
    '_prisma_migrations',
    'assisted_setup_requests',
    'auth_attempts',
    'budget_events',
    'budget_items',
    'budget_photos',
    'budget_versions',
    'budgets',
    'business_categories',
    'cities',
    'companies',
    'company_page_daily_stats',
    'company_photos',
    'customers',
    'email_verification_tokens',
    'password_reset_tokens',
    'quote_requests',
    'services',
    'states',
    'subscriptions',
    'users'
    ])
    AND (
       NOT c.relrowsecurity
       OR has_table_privilege('anon',c.oid,'SELECT')
       OR has_table_privilege('authenticated',c.oid,'UPDATE')
       OR NOT EXISTS(SELECT 1 FROM pg_policies p
                     WHERE p.schemaname='public' AND p.tablename=c.relname
                       AND p.policyname='orcah_server_roles_full')
    );
  IF remaining <> 0 THEN
    RAISE EXCEPTION 'ORCAH: validação pós-aplicação falhou em % tabela(s)',remaining;
  END IF;

  SELECT count(*) INTO app_broken
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND c.relname = ANY(ARRAY[
    '_prisma_migrations',
    'assisted_setup_requests',
    'auth_attempts',
    'budget_events',
    'budget_items',
    'budget_photos',
    'budget_versions',
    'budgets',
    'business_categories',
    'cities',
    'companies',
    'company_page_daily_stats',
    'company_photos',
    'customers',
    'email_verification_tokens',
    'password_reset_tokens',
    'quote_requests',
    'services',
    'states',
    'subscriptions',
    'users'
    ])
    AND (NOT has_table_privilege('orcah_production_app',c.oid,'SELECT')
      OR NOT has_table_privilege('orcah_preview_app',c.oid,'INSERT'));
  IF app_broken <> 0 THEN
    RAISE EXCEPTION 'ORCAH: privilégios Prisma inválidos em % tabela(s)',app_broken;
  END IF;
END
$verify$;

COMMIT;
