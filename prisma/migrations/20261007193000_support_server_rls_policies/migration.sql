-- Allow only ORÇAH server-side database roles through RLS.
-- Browser roles (anon/authenticated) remain without grants/policies.

CREATE POLICY "support_threads_server_access"
ON "support_threads"
FOR ALL
TO orcah_production_app, orcah_preview_app
USING (true)
WITH CHECK (true);

CREATE POLICY "support_messages_server_access"
ON "support_messages"
FOR ALL
TO orcah_production_app, orcah_preview_app
USING (true)
WITH CHECK (true);
