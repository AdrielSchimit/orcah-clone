-- O Instagram da página só vale depois que o prestador confirma o @.
-- Contas que já tinham um @ digitado continuam publicadas.

ALTER TABLE "companies" ADD COLUMN "instagram_confirmed" BOOLEAN NOT NULL DEFAULT false;

UPDATE "companies"
SET "instagram_confirmed" = true
WHERE "instagram" IS NOT NULL AND btrim("instagram") <> '';
