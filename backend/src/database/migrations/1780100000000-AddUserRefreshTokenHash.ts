import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRefreshTokenHash1780100000000
    implements MigrationInterface
{
    name = 'AddUserRefreshTokenHash1780100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `users` ADD `refreshTokenHash` varchar(255) NULL',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `users` DROP COLUMN `refreshTokenHash`',
        );
    }
}
