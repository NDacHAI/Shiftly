import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartments1781000000000 implements MigrationInterface {
    name = 'CreateDepartments1781000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `departments` (`id` varchar(36) NOT NULL, `code` varchar(20) NOT NULL, `name` varchar(100) NOT NULL, `description` text NULL, `status` tinyint NOT NULL DEFAULT 1, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `deleted_at` datetime(6) NULL, UNIQUE INDEX `IDX_departments_code` (`code`), UNIQUE INDEX `IDX_departments_name` (`name`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX `IDX_departments_name` ON `departments`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_departments_code` ON `departments`',
        );
        await queryRunner.query('DROP TABLE `departments`');
    }
}
