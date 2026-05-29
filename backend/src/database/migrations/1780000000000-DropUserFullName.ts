import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserFullName1780000000000 implements MigrationInterface {
    name = 'DropUserFullName1780000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `users` DROP COLUMN `fullName`');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `users` ADD `fullName` varchar(100) NOT NULL',
        );
    }
}
