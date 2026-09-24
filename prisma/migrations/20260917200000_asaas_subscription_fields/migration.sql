ALTER TABLE `subscriptions`
    ADD COLUMN `provider_customer_id` VARCHAR(80) NULL,
    ADD COLUMN `provider_payment_id` VARCHAR(80) NULL,
    ADD COLUMN `billing_type` VARCHAR(20) NULL;

ALTER TABLE `subscriptions`
    MODIFY `amount` DECIMAL(10, 2) NOT NULL DEFAULT 29.00;

UPDATE `subscriptions` SET `amount` = 29.00 WHERE `provider` = 'local';
