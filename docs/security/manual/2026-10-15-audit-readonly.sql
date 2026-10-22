-- ORÇAH 15/10/2026 — Evidências de hardening (somente SELECT)
-- Executar antes e depois do SQL manual; NÃO consulta linhas de clientes.
SELECT c.relname AS tabela,
       pg_get_userbyid(c.relowner) AS dono,
       c.relrowsecurity AS rls_ligada,
       has_table_privilege('anon',c.oid,'SELECT') AS anon_select,
       has_table_privilege('anon',c.oid,'INSERT') AS anon_insert,
       has_table_privilege('authenticated',c.oid,'UPDATE') AS authenticated_update,
       has_table_privilege('orcah_production_app',c.oid,'SELECT') AS app_prod_select,
       has_table_privilege('orcah_preview_app',c.oid,'INSERT') AS app_preview_insert,
       EXISTS(SELECT 1 FROM pg_policies p WHERE p.schemaname='public'
              AND p.tablename=c.relname
              AND p.policyname='orcah_server_roles_full') AS policy_servidor
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname NOT IN ('orcah_ops_shared_documents','support_threads','support_messages')
ORDER BY c.relname;

SELECT c.relname AS sequencia,
       has_sequence_privilege('anon',c.oid,'USAGE') anon_usage,
       has_sequence_privilege('orcah_production_app',c.oid,'USAGE') prod_usage,
       has_sequence_privilege('orcah_preview_app',c.oid,'USAGE') preview_usage
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='S' ORDER BY c.relname;

SELECT tablename, policyname, roles, cmd FROM pg_policies
WHERE schemaname='public' AND (tablename='support_threads' OR tablename='support_messages'
OR policyname='orcah_server_roles_full') ORDER BY tablename,policyname;
