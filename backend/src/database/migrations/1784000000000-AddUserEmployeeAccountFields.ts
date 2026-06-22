import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEmployeeAccountFields1784000000000
    implements MigrationInterface {
    name = 'AddUserEmployeeAccountFields1784000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `users` ADD `is_master` tinyint NOT NULL DEFAULT 0',
        );
        await queryRunner.query(
            'ALTER TABLE `users` ADD `must_change_password` tinyint NOT NULL DEFAULT 0',
        );
        await queryRunner.query(
            'ALTER TABLE `users` ADD `employee_id` varchar(36) NULL',
        );
        await queryRunner.query(
            'CREATE UNIQUE INDEX `IDX_users_employee_id` ON `users` (`employee_id`)',
        );
        await queryRunner.query(
            'ALTER TABLE `users` ADD CONSTRAINT `FK_users_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `users` DROP FOREIGN KEY `FK_users_employee`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_users_employee_id` ON `users`',
        );
        await queryRunner.query(
            'ALTER TABLE `users` DROP COLUMN `employee_id`',
        );
        await queryRunner.query(
            'ALTER TABLE `users` DROP COLUMN `must_change_password`',
        );
        await queryRunner.query(
            'ALTER TABLE `users` DROP COLUMN `is_master`',
        );
    }
}