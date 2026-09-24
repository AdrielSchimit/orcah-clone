-- AlterTable
ALTER TABLE `budgets` ADD COLUMN `extras` JSON NULL;

-- AlterTable
ALTER TABLE `budget_items`
    ADD COLUMN `kind` VARCHAR(40) NULL,
    ADD COLUMN `group_name` VARCHAR(80) NULL;
