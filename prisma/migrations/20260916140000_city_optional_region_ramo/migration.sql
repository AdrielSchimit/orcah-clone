-- AlterTable
ALTER TABLE `cities` MODIFY `ibge_code` VARCHAR(7) NULL;

-- AlterTable
ALTER TABLE `companies` DROP FOREIGN KEY `companies_city_id_fkey`;

-- AlterTable
ALTER TABLE `companies`
    MODIFY `city_id` INTEGER NULL,
    ADD COLUMN `custom_ramo_name` VARCHAR(80) NULL,
    ADD COLUMN `serves_region` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
