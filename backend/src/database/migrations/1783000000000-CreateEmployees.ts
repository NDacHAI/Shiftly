import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployees1783000000000 implements MigrationInterface {
    name = 'CreateEmployees1783000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `employees` (`id` varchar(36) NOT NULL, `employee_code` varchar(50) NOT NULL, `first_name` varchar(100) NOT NULL, `last_name` varchar(100) NOT NULL, `email` varchar(255) NOT NULL, `phone_number` varchar(20) NULL, `date_of_birth` date NULL, `gender` varchar(20) NULL, `hire_date` date NOT NULL, `address` text NULL, `status` enum ('Active', 'Inactive') NOT NULL DEFAULT 'Active', `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_employees_employee_code` (`employee_code`), UNIQUE INDEX `IDX_employees_email` (`email`), INDEX `IDX_employees_status` (`status`), PRIMARY KEY (`id`)) ENGINE=InnoDB",
        );
        await queryRunner.query(
            'CREATE TABLE `employee_departments` (`employee_id` varchar(36) NOT NULL, `department_id` varchar(36) NOT NULL, INDEX `IDX_employee_departments_employee_id` (`employee_id`), INDEX `IDX_employee_departments_department_id` (`department_id`), UNIQUE INDEX `IDX_employee_departments_unique` (`employee_id`, `department_id`), PRIMARY KEY (`employee_id`, `department_id`)) ENGINE=InnoDB',
        );
        await queryRunner.query(
            'CREATE TABLE `employee_positions` (`employee_id` varchar(36) NOT NULL, `position_id` varchar(36) NOT NULL, INDEX `IDX_employee_positions_employee_id` (`employee_id`), INDEX `IDX_employee_positions_position_id` (`position_id`), UNIQUE INDEX `IDX_employee_positions_unique` (`employee_id`, `position_id`), PRIMARY KEY (`employee_id`, `position_id`)) ENGINE=InnoDB',
        );
        await queryRunner.query(
            'ALTER TABLE `employee_departments` ADD CONSTRAINT `FK_employee_departments_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION',
        );
        await queryRunner.query(
            'ALTER TABLE `employee_departments` ADD CONSTRAINT `FK_employee_departments_department` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION',
        );
        await queryRunner.query(
            'ALTER TABLE `employee_positions` ADD CONSTRAINT `FK_employee_positions_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION',
        );
        await queryRunner.query(
            'ALTER TABLE `employee_positions` ADD CONSTRAINT `FK_employee_positions_position` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `employee_positions` DROP FOREIGN KEY `FK_employee_positions_position`',
        );
        await queryRunner.query(
            'ALTER TABLE `employee_positions` DROP FOREIGN KEY `FK_employee_positions_employee`',
        );
        await queryRunner.query(
            'ALTER TABLE `employee_departments` DROP FOREIGN KEY `FK_employee_departments_department`',
        );
        await queryRunner.query(
            'ALTER TABLE `employee_departments` DROP FOREIGN KEY `FK_employee_departments_employee`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_employee_positions_unique` ON `employee_positions`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_employee_positions_position_id` ON `employee_positions`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_employee_positions_employee_id` ON `employee_positions`',
        );
        await queryRunner.query('DROP TABLE `employee_positions`');
        await queryRunner.query(
            'DROP INDEX `IDX_employee_departments_unique` ON `employee_departments`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_employee_departments_department_id` ON `employee_departments`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_employee_departments_employee_id` ON `employee_departments`',
        );
        await queryRunner.query('DROP TABLE `employee_departments`');
        await queryRunner.query(
            'DROP INDEX `IDX_employees_status` ON `employees`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_employees_email` ON `employees`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_employees_employee_code` ON `employees`',
        );
        await queryRunner.query('DROP TABLE `employees`');
    }
}
