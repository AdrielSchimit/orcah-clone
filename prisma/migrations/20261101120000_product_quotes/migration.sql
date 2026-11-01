-- CreateEnum
CREATE TYPE "ProductQuoteStatus" AS ENUM ('open', 'reserved');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "whatsapp_prompt_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp_robot" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "store" VARCHAR(120),
    "whatsapp" VARCHAR(20) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_quotes" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "status" "ProductQuoteStatus" NOT NULL DEFAULT 'open',
    "reserved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_quote_items" (
    "id" SERIAL NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "description" VARCHAR(160) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_quote_suppliers" (
    "id" SERIAL NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "public_token" VARCHAR(24) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "product_quote_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_quote_offers" (
    "id" SERIAL NOT NULL,
    "quote_supplier_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "brand" VARCHAR(80),
    "unit_price" DECIMAL(12,2),
    "selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_quote_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_company_id_idx" ON "suppliers"("company_id");

-- CreateIndex
CREATE INDEX "product_quotes_company_id_created_at_idx" ON "product_quotes"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "product_quote_items_quote_id_idx" ON "product_quote_items"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_quote_suppliers_public_token_key" ON "product_quote_suppliers"("public_token");

-- CreateIndex
CREATE INDEX "product_quote_suppliers_supplier_id_idx" ON "product_quote_suppliers"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_quote_suppliers_quote_id_supplier_id_key" ON "product_quote_suppliers"("quote_id", "supplier_id");

-- CreateIndex
CREATE INDEX "product_quote_offers_item_id_idx" ON "product_quote_offers"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_quote_offers_quote_supplier_id_item_id_key" ON "product_quote_offers"("quote_supplier_id", "item_id");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quotes" ADD CONSTRAINT "product_quotes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_items" ADD CONSTRAINT "product_quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "product_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_suppliers" ADD CONSTRAINT "product_quote_suppliers_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "product_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_suppliers" ADD CONSTRAINT "product_quote_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_offers" ADD CONSTRAINT "product_quote_offers_quote_supplier_id_fkey" FOREIGN KEY ("quote_supplier_id") REFERENCES "product_quote_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_offers" ADD CONSTRAINT "product_quote_offers_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "product_quote_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

