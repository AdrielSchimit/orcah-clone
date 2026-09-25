-- Aditiva: só cria tabelas e uma coluna opcional. Nenhum usuário ou hash de senha é alterado.
ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3);

CREATE TABLE "password_reset_tokens" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "token_hash" CHAR(64) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_attempts" (
  "id" SERIAL NOT NULL,
  "purpose" VARCHAR(40) NOT NULL,
  "email" VARCHAR(180) NOT NULL,
  "request_ip_hash" CHAR(64),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");
CREATE INDEX "auth_attempts_purpose_email_created_at_idx" ON "auth_attempts"("purpose", "email", "created_at");
CREATE INDEX "auth_attempts_purpose_request_ip_hash_created_at_idx" ON "auth_attempts"("purpose", "request_ip_hash", "created_at");
CREATE INDEX "auth_attempts_created_at_idx" ON "auth_attempts"("created_at");

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
