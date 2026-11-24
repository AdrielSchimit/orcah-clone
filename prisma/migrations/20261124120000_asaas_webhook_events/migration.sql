-- CreateTable
CREATE TABLE "asaas_webhook_events" (
    "id" VARCHAR(120) NOT NULL,
    "event" VARCHAR(60) NOT NULL,
    "payment_id" VARCHAR(80),
    "subscription_id" VARCHAR(80),
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "processed_at" TIMESTAMP(3),
    "last_error" VARCHAR(40),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asaas_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asaas_webhook_events_payment_id_idx" ON "asaas_webhook_events"("payment_id");

-- CreateIndex
CREATE INDEX "asaas_webhook_events_processed_at_created_at_idx" ON "asaas_webhook_events"("processed_at", "created_at");


-- One row per Asaas event.id. Only identifiers and event type: no payer data, card data or payload.
ALTER TABLE "asaas_webhook_events" ADD CONSTRAINT "asaas_webhook_events_attempts_check" CHECK (attempts >= 1);

-- Private to the server, same contract as the support tables: RLS on, no browser grants or policies.
ALTER TABLE "asaas_webhook_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "asaas_webhook_events" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "asaas_webhook_events" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "asaas_webhook_events" FROM authenticated;
  END IF;
  -- Server-side ORÇAH roles (only where they exist, so local/CI databases still migrate).
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orcah_production_app') THEN
    CREATE POLICY "asaas_webhook_events_production_access" ON "asaas_webhook_events"
      FOR ALL TO orcah_production_app USING (true) WITH CHECK (true);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orcah_preview_app') THEN
    CREATE POLICY "asaas_webhook_events_preview_access" ON "asaas_webhook_events"
      FOR ALL TO orcah_preview_app USING (true) WITH CHECK (true);
  END IF;
END $$;
