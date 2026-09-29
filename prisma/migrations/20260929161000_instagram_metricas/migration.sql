-- Cliques no botão do Instagram e visitas que chegaram de lá.
-- Sem IP e sem identificar pessoa. Colunas novas começam em zero.

ALTER TABLE "company_page_daily_stats" ADD COLUMN "instagram_clicks" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "company_page_daily_stats" ADD COLUMN "instagram_visits" INTEGER NOT NULL DEFAULT 0;
