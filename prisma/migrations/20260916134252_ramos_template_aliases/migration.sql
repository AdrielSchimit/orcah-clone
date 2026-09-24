-- Add category metadata used by ramo templates.
-- Keep this migration focused on business_categories; foreign keys are already
-- created by the initial migration and must not be dropped/recreated here.

ALTER TABLE `business_categories`
    ADD COLUMN `search_aliases` JSON NOT NULL,
    ADD COLUMN `template_key` VARCHAR(40) NOT NULL DEFAULT 'base';

CREATE INDEX `business_categories_template_key_idx`
    ON `business_categories`(`template_key`);
