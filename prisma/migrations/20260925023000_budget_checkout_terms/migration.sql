ALTER TABLE "budgets"
  ADD COLUMN "discount_type" VARCHAR(12) NOT NULL DEFAULT 'amount',
  ADD COLUMN "discount_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "payment_method" VARCHAR(24),
  ADD COLUMN "accepted_payment_methods" JSONB,
  ADD COLUMN "payment_condition" VARCHAR(24) NOT NULL DEFAULT 'cash',
  ADD COLUMN "down_payment_type" VARCHAR(12),
  ADD COLUMN "down_payment_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "down_payment_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "budgets"
SET
  "discount_type" = 'amount',
  "discount_value" = "discount",
  "payment_method" = COALESCE("payment_method", 'pix'),
  "accepted_payment_methods" = COALESCE("accepted_payment_methods", '["pix"]'::jsonb),
  "payment_condition" = COALESCE("payment_condition", 'cash'),
  "down_payment_value" = COALESCE("down_payment_value", 0),
  "down_payment_amount" = COALESCE("down_payment_amount", 0);

ALTER TABLE "budgets"
  ADD CONSTRAINT "budgets_discount_type_check" CHECK ("discount_type" IN ('amount', 'percent')),
  ADD CONSTRAINT "budgets_payment_method_check" CHECK ("payment_method" IS NULL OR "payment_method" IN ('pix', 'card', 'boleto', 'cash', 'transfer')),
  ADD CONSTRAINT "budgets_payment_condition_check" CHECK ("payment_condition" IN ('cash', 'deposit_balance', 'installments_2', 'installments_3', 'custom')),
  ADD CONSTRAINT "budgets_down_payment_type_check" CHECK ("down_payment_type" IS NULL OR "down_payment_type" IN ('amount', 'percent'));
