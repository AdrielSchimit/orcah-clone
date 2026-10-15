-- Synthetic PostgreSQL-only fixture; does not touch Supabase or real users.
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
CREATE ROLE orcah_production_app;
CREATE ROLE orcah_preview_app;

DO $fixture$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
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
  ]
  LOOP
    EXECUTE format('CREATE TABLE public.%I (id bigint PRIMARY KEY)',t);
    EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role',t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO orcah_production_app, orcah_preview_app',t);
  END LOOP;
END
$fixture$;
CREATE SEQUENCE public.users_id_seq;
GRANT ALL ON SEQUENCE public.users_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.users_id_seq TO orcah_production_app, orcah_preview_app;
