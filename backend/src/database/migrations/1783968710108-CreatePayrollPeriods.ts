import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePayrollPeriods1783968710108 implements MigrationInterface {
    name = 'CreatePayrollPeriods1783968710108'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`payroll_periods\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(50) NOT NULL, \`name\` varchar(255) NOT NULL, \`payroll_month\` tinyint NOT NULL, \`payroll_year\` smallint NOT NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`status\` enum ('DRAFT', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'DRAFT', \`opened_at\` datetime NULL, \`closed_at\` datetime NULL, \`created_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fbaa0427acdb12f0bc09213c3d\` (\`code\`), INDEX \`IDX_9e26c05511d9f2299535835a4c\` (\`status\`), INDEX \`IDX_7e5a4352223a4e749d16c52084\` (\`created_by\`), INDEX \`IDX_86c1f27430cc12d897b3309cc3\` (\`start_date\`, \`end_date\`), UNIQUE INDEX \`IDX_42fbdabeb8a95d903500eae3cd\` (\`payroll_month\`, \`payroll_year\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`payroll_periods\` ADD CONSTRAINT \`FK_7e5a4352223a4e749d16c520849\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`payroll_periods\` DROP FOREIGN KEY \`FK_7e5a4352223a4e749d16c520849\``);
        await queryRunner.query(`DROP INDEX \`IDX_42fbdabeb8a95d903500eae3cd\` ON \`payroll_periods\``);
        await queryRunner.query(`DROP INDEX \`IDX_86c1f27430cc12d897b3309cc3\` ON \`payroll_periods\``);
        await queryRunner.query(`DROP INDEX \`IDX_7e5a4352223a4e749d16c52084\` ON \`payroll_periods\``);
        await queryRunner.query(`DROP INDEX \`IDX_9e26c05511d9f2299535835a4c\` ON \`payroll_periods\``);
        await queryRunner.query(`DROP INDEX \`IDX_fbaa0427acdb12f0bc09213c3d\` ON \`payroll_periods\``);
        await queryRunner.query(`DROP TABLE \`payroll_periods\``);
    }

}
