-- Página comercial: só aditiva (colunas novas com default, tabelas novas). Nenhum dado existente é alterado.

-- CreateEnum
CREATE TYPE "AssistedSetupStatus" AS ENUM ('requested', 'contacted', 'in_progress', 'completed', 'canceled');

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "category" VARCHAR(80),
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image_path" VARCHAR(500),
ADD COLUMN     "show_price" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "company_page_daily_stats" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_clicks" INTEGER NOT NULL DEFAULT 0,
    "quote_clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_page_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assisted_setup_requests" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "status" "AssistedSetupStatus" NOT NULL DEFAULT 'requested',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assisted_setup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_page_daily_stats_company_id_date_key" ON "company_page_daily_stats"("company_id", "date");

-- CreateIndex
CREATE INDEX "assisted_setup_requests_company_id_status_idx" ON "assisted_setup_requests"("company_id", "status");

-- CreateIndex
CREATE INDEX "assisted_setup_requests_status_created_at_idx" ON "assisted_setup_requests"("status", "created_at");

-- AddForeignKey
ALTER TABLE "company_page_daily_stats" ADD CONSTRAINT "company_page_daily_stats_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assisted_setup_requests" ADD CONSTRAINT "assisted_setup_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

