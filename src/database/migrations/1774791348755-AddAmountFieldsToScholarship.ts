import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAmountFieldsToScholarship1774791348755 implements MigrationInterface {
    name = 'AddAmountFieldsToScholarship1774791348755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`scholarships\` ADD \`amount\` decimal(10,2) NULL COMMENT 'Full scholarship value'`);
        await queryRunner.query(`ALTER TABLE \`scholarships\` ADD \`discounted_amount\` decimal(10,2) NULL COMMENT 'Discounted amount if applicable'`);
        await queryRunner.query(`ALTER TABLE \`scholarships\` ADD \`currency\` char(3) NULL COMMENT 'ISO 4217 currency code e.g USD, GBP'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`is_active\` \`is_active\` tinyint(1) NOT NULL DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`is_active\` \`is_active\` tinyint NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`scholarships\` DROP COLUMN \`currency\``);
        await queryRunner.query(`ALTER TABLE \`scholarships\` DROP COLUMN \`discounted_amount\``);
        await queryRunner.query(`ALTER TABLE \`scholarships\` DROP COLUMN \`amount\``);
    }

}
