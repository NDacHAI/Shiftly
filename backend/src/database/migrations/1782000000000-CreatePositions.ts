import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePositions1782000000000 implements MigrationInterface {
    name = 'CreatePositions1782000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `positions` (`id` varchar(36) NOT NULL, `department_id` varchar(36) NOT NULL, `code` varchar(50) NOT NULL, `name` varchar(255) NOT NULL, `description` text NULL, `status` tinyint NOT NULL DEFAULT 1, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `deleted_at` datetime(6) NULL, UNIQUE INDEX `IDX_positions_code` (`code`), INDEX `IDX_positions_department_id` (`department_id`), INDEX `IDX_positions_status` (`status`), PRIMARY KEY (`id`), CONSTRAINT `FK_positions_department` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION) ENGINE=InnoDB',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `positions` DROP FOREIGN KEY `FK_positions_department`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_positions_status` ON `positions`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_positions_department_id` ON `positions`',
        );
        await queryRunner.query(
            'DROP INDEX `IDX_positions_code` ON `positions`',
        );
        await queryRunner.query('DROP TABLE `positions`');
    }
}
