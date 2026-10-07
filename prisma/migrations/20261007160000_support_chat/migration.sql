-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('BOT', 'QUEUED', 'HUMAN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "SupportSenderType" AS ENUM ('USER', 'ASSISTANT', 'OPERATOR', 'SYSTEM');

-- CreateTable
CREATE TABLE "support_threads" (
    "id" TEXT NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'BOT',
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "assigned_operator" VARCHAR(120),
    "assigned_operator_id" VARCHAR(80),
    "subject" VARCHAR(120),
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queued_at" TIMESTAMP(3),
    "human_started_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_type" "SupportSenderType" NOT NULL,
    "sender_name" VARCHAR(120),
    "client_id" VARCHAR(90),
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_threads_user_id_last_message_at_idx" ON "support_threads"("user_id", "last_message_at");

-- CreateIndex
CREATE INDEX "support_threads_status_priority_queued_at_idx" ON "support_threads"("status", "priority", "queued_at");

-- CreateIndex
CREATE INDEX "support_threads_last_message_at_id_idx" ON "support_threads"("last_message_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "support_threads_company_id_user_id_key" ON "support_threads"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "support_messages_thread_id_created_at_id_idx" ON "support_messages"("thread_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "support_messages_thread_id_sender_type_read_at_idx" ON "support_messages"("thread_id", "sender_type", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "support_messages_thread_id_sender_type_client_id_key" ON "support_messages"("thread_id", "sender_type", "client_id");

-- AddForeignKey
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "support_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- These tables are private even if the platform grants Data API access by default.
-- Custom ORÇAH sessions are authorized exclusively by server endpoints; no browser policies.
ALTER TABLE "support_threads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_messages" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "support_threads", "support_messages" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "support_threads", "support_messages" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "support_threads", "support_messages" FROM authenticated;
  END IF;
END $$;

ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_content_length_check"
  CHECK (char_length(content) BETWEEN 1 AND 2000);

-- HUMAN has an assigned operator; other states do not retain an assignment.
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_assignment_check"
  CHECK (
    (status = 'HUMAN' AND assigned_operator_id IS NOT NULL AND assigned_operator IS NOT NULL
      AND char_length(btrim(assigned_operator_id)) > 0 AND char_length(btrim(assigned_operator)) > 0)
    OR (status <> 'HUMAN' AND assigned_operator_id IS NULL AND assigned_operator IS NULL)
  );

-- Handoff cycle timestamps follow BOT -> QUEUED -> HUMAN -> RESOLVED.
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_cycle_check"
  CHECK (
    (status = 'BOT' AND queued_at IS NULL AND human_started_at IS NULL AND resolved_at IS NULL) OR
    (status = 'QUEUED' AND queued_at IS NOT NULL AND human_started_at IS NULL AND resolved_at IS NULL) OR
    (status = 'HUMAN' AND queued_at IS NOT NULL AND human_started_at IS NOT NULL AND resolved_at IS NULL) OR
    (status = 'RESOLVED' AND queued_at IS NOT NULL AND human_started_at IS NOT NULL AND resolved_at IS NOT NULL)
  );
