import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHolidays1783859623190 implements MigrationInterface {
    name = 'CreateHolidays1783859623190'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`holidays\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`holiday_date\` date NOT NULL, \`description\` text NULL, \`status\` tinyint NOT NULL DEFAULT '1', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_edf0ee22a056c330fa5f121782\` (\`name\`), UNIQUE INDEX \`IDX_f274f2003325dd6a0bc9d660a0\` (\`holiday_date\`), INDEX \`IDX_442788d3141c77e69034e8f5f4\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_442788d3141c77e69034e8f5f4\` ON \`holidays\``);
        await queryRunner.query(`DROP INDEX \`IDX_f274f2003325dd6a0bc9d660a0\` ON \`holidays\``);
        await queryRunner.query(`DROP INDEX \`IDX_edf0ee22a056c330fa5f121782\` ON \`holidays\``);
        await queryRunner.query(`DROP TABLE \`holidays\``);
    }

}
