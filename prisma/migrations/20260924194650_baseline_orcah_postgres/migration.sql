CREATE TYPE "BudgetStatus" AS ENUM ('draft','sent','viewed','waiting','approved','rejected','expired');
CREATE TYPE "BudgetEventType" AS ENUM ('created','sent','viewed','approved','rejected','revision_requested','expired');
CREATE TYPE "QuoteRequestStatus" AS ENUM ('new','contacted','converted','archived');
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing','active','past_due','canceled');

CREATE TABLE "states" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(60) NOT NULL,
  "uf" CHAR(2) NOT NULL UNIQUE,
  "ibge_code" CHAR(2) NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "cities" (
  "id" SERIAL PRIMARY KEY,
  "state_id" INTEGER NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "slug" VARCHAR(140) NOT NULL,
  "ibge_code" VARCHAR(7) UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "cities_state_id_slug_key" ON "cities"("state_id","slug");
CREATE INDEX "cities_state_id_name_idx" ON "cities"("state_id","name");

CREATE TABLE "business_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(80) NOT NULL,
  "slug" VARCHAR(80) NOT NULL UNIQUE,
  "template_key" VARCHAR(40) NOT NULL DEFAULT 'base',
  "search_aliases" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "business_categories_template_key_idx" ON "business_categories"("template_key");

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(180) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "companies" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE,
  "business_category_id" INTEGER,
  "custom_ramo_name" VARCHAR(80),
  "state_id" INTEGER NOT NULL,
  "city_id" INTEGER,
  "serves_region" BOOLEAN NOT NULL DEFAULT FALSE,
  "name" VARCHAR(160) NOT NULL,
  "trade_name" VARCHAR(160),
  "document" VARCHAR(20),
  "phone" VARCHAR(20) NOT NULL,
  "whatsapp" VARCHAR(20) NOT NULL,
  "email" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "address" VARCHAR(255),
  "neighborhood" VARCHAR(120),
  "zip_code" VARCHAR(10),
  "website" VARCHAR(180),
  "instagram" VARCHAR(120),
  "facebook" VARCHAR(180),
  "opening_hours" VARCHAR(160),
  "primary_color" VARCHAR(7),
  "secondary_color" VARCHAR(7),
  "logo_path" VARCHAR(255),
  "slug" VARCHAR(160) NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "companies_business_category_id_fkey" FOREIGN KEY ("business_category_id") REFERENCES "business_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "companies_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "companies_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "companies_city_id_idx" ON "companies"("city_id");
CREATE INDEX "companies_state_id_idx" ON "companies"("state_id");
CREATE INDEX "companies_business_category_id_idx" ON "companies"("business_category_id");

CREATE TABLE "customers" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "state_id" INTEGER,
  "city_id" INTEGER,
  "name" VARCHAR(160) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "whatsapp" VARCHAR(20),
  "email" VARCHAR(180),
  "document" VARCHAR(20),
  "address" VARCHAR(255),
  "neighborhood" VARCHAR(120),
  "notes" TEXT,
  "first_contact_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "customers_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "customers_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");
CREATE INDEX "customers_company_id_phone_idx" ON "customers"("company_id","phone");
CREATE INDEX "customers_city_id_idx" ON "customers"("city_id");
CREATE INDEX "customers_state_id_idx" ON "customers"("state_id");

CREATE TABLE "services" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "unit" VARCHAR(20) NOT NULL DEFAULT 'un',
  "default_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "services_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "services_company_id_active_idx" ON "services"("company_id","active");

CREATE TABLE "budgets" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "customer_id" INTEGER NOT NULL,
  "service_state_id" INTEGER,
  "service_city_id" INTEGER,
  "number" VARCHAR(24) NOT NULL,
  "public_token" VARCHAR(24) NOT NULL UNIQUE,
  "status" "BudgetStatus" NOT NULL DEFAULT 'draft',
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "validity_date" DATE,
  "estimated_days" INTEGER,
  "service_address" VARCHAR(255),
  "notes" TEXT,
  "extras" JSONB,
  "sent_at" TIMESTAMP(3),
  "viewed_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "rejected_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "budgets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "budgets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "budgets_service_state_id_fkey" FOREIGN KEY ("service_state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "budgets_service_city_id_fkey" FOREIGN KEY ("service_city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "budgets_company_id_number_key" ON "budgets"("company_id","number");
CREATE INDEX "budgets_company_id_status_idx" ON "budgets"("company_id","status");
CREATE INDEX "budgets_public_token_idx" ON "budgets"("public_token");
CREATE INDEX "budgets_service_city_id_idx" ON "budgets"("service_city_id");
CREATE INDEX "budgets_customer_id_idx" ON "budgets"("customer_id");
CREATE INDEX "budgets_service_state_id_idx" ON "budgets"("service_state_id");

CREATE TABLE "budget_items" (
  "id" SERIAL PRIMARY KEY,
  "budget_id" INTEGER NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "unit" VARCHAR(20) NOT NULL DEFAULT 'un',
  "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "kind" VARCHAR(40),
  "group_name" VARCHAR(80),
  "notes" VARCHAR(255),
  "material" VARCHAR(120),
  "deadline" VARCHAR(40),
  "length" VARCHAR(20),
  "width" VARCHAR(20),
  "height" VARCHAR(20),
  "area_note" VARCHAR(80),
  "power_note" VARCHAR(20),
  "volume_note" VARCHAR(20),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "budget_items_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "budget_items_budget_id_idx" ON "budget_items"("budget_id");

CREATE TABLE "budget_versions" (
  "id" SERIAL PRIMARY KEY,
  "budget_id" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "discount" DECIMAL(12,2) NOT NULL,
  "total" DECIMAL(12,2) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "budget_versions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "budget_versions_budget_id_version_key" ON "budget_versions"("budget_id","version");

CREATE TABLE "budget_events" (
  "id" SERIAL PRIMARY KEY,
  "budget_id" INTEGER NOT NULL,
  "event" "BudgetEventType" NOT NULL,
  "metadata" JSONB,
  "ip_address" VARCHAR(45),
  "user_agent" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "budget_events_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "budget_events_budget_id_event_idx" ON "budget_events"("budget_id","event");

CREATE TABLE "budget_photos" (
  "id" SERIAL PRIMARY KEY,
  "budget_id" INTEGER NOT NULL,
  "path" VARCHAR(255) NOT NULL,
  "caption" VARCHAR(180),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "budget_photos_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "budget_photos_budget_id_idx" ON "budget_photos"("budget_id");

CREATE TABLE "company_photos" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "path" VARCHAR(255) NOT NULL,
  "title" VARCHAR(120),
  "description" VARCHAR(255),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_photos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "company_photos_company_id_active_idx" ON "company_photos"("company_id","active");

CREATE TABLE "quote_requests" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "state_id" INTEGER,
  "city_id" INTEGER,
  "customer_name" VARCHAR(160) NOT NULL,
  "customer_phone" VARCHAR(20) NOT NULL,
  "customer_email" VARCHAR(180),
  "desired_service" VARCHAR(180),
  "description" TEXT,
  "neighborhood" VARCHAR(120),
  "preferred_time" VARCHAR(80),
  "status" "QuoteRequestStatus" NOT NULL DEFAULT 'new',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quote_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "quote_requests_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "quote_requests_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "quote_requests_company_id_status_idx" ON "quote_requests"("company_id","status");
CREATE INDEX "quote_requests_city_id_idx" ON "quote_requests"("city_id");
CREATE INDEX "quote_requests_state_id_idx" ON "quote_requests"("state_id");

CREATE TABLE "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL UNIQUE,
  "provider" VARCHAR(40) NOT NULL,
  "provider_subscription_id" VARCHAR(80),
  "provider_customer_id" VARCHAR(80),
  "provider_payment_id" VARCHAR(80),
  "billing_type" VARCHAR(20),
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
  "plan" VARCHAR(40) NOT NULL DEFAULT 'unico',
  "amount" DECIMAL(10,2) NOT NULL DEFAULT 29.00,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
