ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- O telefone identifica contas sem e-mail, sem alterar os telefones de contas existentes.
CREATE UNIQUE INDEX "users_phone_without_email_key"
ON "users" ("phone") WHERE "email" IS NULL;

ALTER TABLE "users" ADD CONSTRAINT "users_login_identifier_check"
CHECK ("email" IS NOT NULL OR ("phone" IS NOT NULL AND "phone" ~ '^[0-9]{10,11}$'));
