ALTER TABLE "companies" ADD COLUMN "cover_history" JSONB NOT NULL DEFAULT '[]';
UPDATE "companies" SET "cover_history" = jsonb_build_array("cover_path") WHERE "cover_path" IS NOT NULL;
