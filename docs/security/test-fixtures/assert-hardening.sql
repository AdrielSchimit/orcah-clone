-- Ensure the SQL is effective and the application roles still work.
DO $check$
DECLARE n int;
BEGIN
SELECT count(*) INTO n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
WHERE ns.nspname='public' AND c.relkind='r'
AND c.relname <> 'orcah_ops_shared_documents';
IF n <> 21 THEN RAISE EXCEPTION 'Expected 21 private tables, found %',n; END IF;

SELECT count(*) INTO n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
WHERE ns.nspname='public' AND c.relkind='r'
  AND (NOT c.relrowsecurity OR has_table_privilege('anon', c.oid, 'SELECT')
    OR has_table_privilege('anon', c.oid, 'UPDATE')
    OR has_table_privilege('authenticated', c.oid, 'INSERT')
    OR NOT has_table_privilege('orcah_production_app',c.oid,'SELECT')
    OR NOT has_table_privilege('orcah_preview_app',c.oid,'UPDATE'));
IF n <> 0 THEN RAISE EXCEPTION 'Security checks failed on % table(s)',n; END IF;

IF has_sequence_privilege('anon','public.users_id_seq','USAGE')
OR NOT has_sequence_privilege('orcah_preview_app','public.users_id_seq','USAGE') THEN
  RAISE EXCEPTION 'Sequence grants failed';
END IF;

SELECT count(*) INTO n FROM pg_policies WHERE schemaname='public'
AND policyname='orcah_server_roles_full';
IF n <> 21 THEN RAISE EXCEPTION 'Expected 21 scoped policies, found %',n; END IF;
END
$check$;
