import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePayrollProcessings1784124262352 implements MigrationInterface {
    name = 'CreatePayrollProcessings1784124262352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`employee_payrolls\` (\`id\` varchar(36) NOT NULL, \`payroll_processing_id\` varchar(36) NOT NULL, \`payroll_period_id\` varchar(36) NOT NULL, \`employee_id\` varchar(36) NOT NULL, \`branch_id\` varchar(36) NOT NULL, \`position_id\` varchar(36) NOT NULL, \`employee_code\` varchar(50) NOT NULL, \`employee_name\` varchar(255) NOT NULL, \`branch_name\` varchar(100) NOT NULL, \`position_name\` varchar(255) NOT NULL, \`hourly_rate\` decimal(12,2) NOT NULL DEFAULT '0.00', \`regular_multiplier\` decimal(5,2) NOT NULL DEFAULT '1.00', \`overtime_multiplier\` decimal(5,2) NOT NULL DEFAULT '1.00', \`holiday_multiplier\` decimal(5,2) NOT NULL DEFAULT '1.00', \`holiday_overtime_multiplier\` decimal(5,2) NOT NULL DEFAULT '1.00', \`worked_minutes\` int NOT NULL DEFAULT '0', \`overtime_minutes\` int NOT NULL DEFAULT '0', \`holiday_minutes\` int NOT NULL DEFAULT '0', \`holiday_overtime_minutes\` int NOT NULL DEFAULT '0', \`reward_total\` decimal(12,2) NOT NULL DEFAULT '0.00', \`penalty_total\` decimal(12,2) NOT NULL DEFAULT '0.00', \`regular_pay\` decimal(12,2) NOT NULL DEFAULT '0.00', \`overtime_pay\` decimal(12,2) NOT NULL DEFAULT '0.00', \`holiday_pay\` decimal(12,2) NOT NULL DEFAULT '0.00', \`holiday_overtime_pay\` decimal(12,2) NOT NULL DEFAULT '0.00', \`gross_pay\` decimal(12,2) NOT NULL DEFAULT '0.00', \`net_pay\` decimal(12,2) NOT NULL DEFAULT '0.00', \`status\` enum ('SUCCESS', 'FAILED', 'FINALIZED') NOT NULL DEFAULT 'SUCCESS', \`error_message\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_6fc146174c3edbf8c19c1ac1e3\` (\`payroll_processing_id\`), INDEX \`IDX_0f94e33801e48eb3ba2d7619f4\` (\`payroll_period_id\`), INDEX \`IDX_6ee564dc53f295a73dac531c51\` (\`employee_id\`), INDEX \`IDX_0aa51139657f3837c98dc9c919\` (\`branch_id\`), INDEX \`IDX_72592d94a105188684e25a0919\` (\`status\`), INDEX \`IDX_a9538e6da32f82ffe850188fe6\` (\`payroll_period_id\`, \`employee_id\`), UNIQUE INDEX \`IDX_bd68d3e3a67c3290413775955d\` (\`payroll_processing_id\`, \`employee_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payroll_processings\` (\`id\` varchar(36) NOT NULL, \`payroll_period_id\` varchar(36) NOT NULL, \`status\` enum ('DRAFT', 'PROCESSING', 'COMPLETED', 'FAILED', 'CLOSED') NOT NULL DEFAULT 'DRAFT', \`total_employees\` int NOT NULL DEFAULT '0', \`processed_employees\` int NOT NULL DEFAULT '0', \`success_count\` int NOT NULL DEFAULT '0', \`failed_count\` int NOT NULL DEFAULT '0', \`generated_at\` datetime NULL, \`generated_by_user_id\` int NULL, \`closed_at\` datetime NULL, \`closed_by_user_id\` int NULL, \`error_message\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a533158ee039cd05ec9ddbed07\` (\`payroll_period_id\`), INDEX \`IDX_f27cbe67a37ca4786decf78989\` (\`status\`), INDEX \`IDX_c9baf10f1f846c741e6c021953\` (\`generated_by_user_id\`), INDEX \`IDX_997e26c58d7928d17cafbc8867\` (\`closed_by_user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` ADD CONSTRAINT \`FK_6fc146174c3edbf8c19c1ac1e30\` FOREIGN KEY (\`payroll_processing_id\`) REFERENCES \`payroll_processings\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` ADD CONSTRAINT \`FK_0f94e33801e48eb3ba2d7619f45\` FOREIGN KEY (\`payroll_period_id\`) REFERENCES \`payroll_periods\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` ADD CONSTRAINT \`FK_6ee564dc53f295a73dac531c513\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` ADD CONSTRAINT \`FK_0aa51139657f3837c98dc9c919c\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` ADD CONSTRAINT \`FK_8481c236d8ec876dd3670b5ebb6\` FOREIGN KEY (\`position_id\`) REFERENCES \`positions\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`payroll_processings\` ADD CONSTRAINT \`FK_a533158ee039cd05ec9ddbed076\` FOREIGN KEY (\`payroll_period_id\`) REFERENCES \`payroll_periods\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`payroll_processings\` ADD CONSTRAINT \`FK_c9baf10f1f846c741e6c0219535\` FOREIGN KEY (\`generated_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`payroll_processings\` ADD CONSTRAINT \`FK_997e26c58d7928d17cafbc88677\` FOREIGN KEY (\`closed_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`payroll_processings\` DROP FOREIGN KEY \`FK_997e26c58d7928d17cafbc88677\``);
        await queryRunner.query(`ALTER TABLE \`payroll_processings\` DROP FOREIGN KEY \`FK_c9baf10f1f846c741e6c0219535\``);
        await queryRunner.query(`ALTER TABLE \`payroll_processings\` DROP FOREIGN KEY \`FK_a533158ee039cd05ec9ddbed076\``);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` DROP FOREIGN KEY \`FK_8481c236d8ec876dd3670b5ebb6\``);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` DROP FOREIGN KEY \`FK_0aa51139657f3837c98dc9c919c\``);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` DROP FOREIGN KEY \`FK_6ee564dc53f295a73dac531c513\``);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` DROP FOREIGN KEY \`FK_0f94e33801e48eb3ba2d7619f45\``);
        await queryRunner.query(`ALTER TABLE \`employee_payrolls\` DROP FOREIGN KEY \`FK_6fc146174c3edbf8c19c1ac1e30\``);
        await queryRunner.query(`DROP INDEX \`IDX_997e26c58d7928d17cafbc8867\` ON \`payroll_processings\``);
        await queryRunner.query(`DROP INDEX \`IDX_c9baf10f1f846c741e6c021953\` ON \`payroll_processings\``);
        await queryRunner.query(`DROP INDEX \`IDX_f27cbe67a37ca4786decf78989\` ON \`payroll_processings\``);
        await queryRunner.query(`DROP INDEX \`IDX_a533158ee039cd05ec9ddbed07\` ON \`payroll_processings\``);
        await queryRunner.query(`DROP TABLE \`payroll_processings\``);
        await queryRunner.query(`DROP INDEX \`IDX_bd68d3e3a67c3290413775955d\` ON \`employee_payrolls\``);
        await queryRunner.query(`DROP INDEX \`IDX_a9538e6da32f82ffe850188fe6\` ON \`employee_payrolls\``);
        await queryRunner.query(`DROP INDEX \`IDX_72592d94a105188684e25a0919\` ON \`employee_payrolls\``);
        await queryRunner.query(`DROP INDEX \`IDX_0aa51139657f3837c98dc9c919\` ON \`employee_payrolls\``);
        await queryRunner.query(`DROP INDEX \`IDX_6ee564dc53f295a73dac531c51\` ON \`employee_payrolls\``);
        await queryRunner.query(`DROP INDEX \`IDX_0f94e33801e48eb3ba2d7619f4\` ON \`employee_payrolls\``);
        await queryRunner.query(`DROP INDEX \`IDX_6fc146174c3edbf8c19c1ac1e3\` ON \`employee_payrolls\``);
        await queryRunner.query(`DROP TABLE \`employee_payrolls\``);
    }

}
