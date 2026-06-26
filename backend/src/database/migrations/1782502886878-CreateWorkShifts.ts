import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkShifts1782502886878 implements MigrationInterface {
    name = 'CreateWorkShifts1782502886878';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `work_shifts` (`id` varchar(36) NOT NULL, `code` varchar(50) NOT NULL, `name` varchar(50) NOT NULL, `start_time` time NOT NULL, `end_time` time NOT NULL, `break_minutes` int NOT NULL DEFAULT 0, `is_overnight` tinyint NOT NULL DEFAULT 0, `description` text NULL, `status` tinyint NOT NULL DEFAULT 1, `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_work_shifts_code` (`code`), UNIQUE INDEX `IDX_work_shifts_name` (`name`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE `work_shifts`');
    }
}
