import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHourlyRateToPositions1782819166670 implements MigrationInterface {
    name = 'AddHourlyRateToPositions1782819166670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`positions\` ADD \`hourly_rate\` decimal(12,2) NOT NULL DEFAULT '0.00'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`positions\` DROP COLUMN \`hourly_rate\``);
    }

}
