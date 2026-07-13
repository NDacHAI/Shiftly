import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePayrollAdjustments1783979417498 implements MigrationInterface {
    name = 'CreatePayrollAdjustments1783979417498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`payroll_adjustments\` (\`id\` varchar(36) NOT NULL, \`payroll_period_id\` varchar(36) NOT NULL, \`employee_id\` varchar(36) NOT NULL, \`branch_id\` varchar(36) NOT NULL, \`catalog_id\` varchar(36) NOT NULL, \`catalog_code\` varchar(50) NOT NULL, \`catalog_name\` varchar(255) NOT NULL, \`category\` tinyint NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`reason\` varchar(500) NOT NULL, \`adjustment_date\` date NOT NULL, \`created_by_user_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_dc93cea538476131e14a1aefa4\` (\`payroll_period_id\`), INDEX \`IDX_9b867b2752b2ffba2b316a7086\` (\`employee_id\`), INDEX \`IDX_9e2907bc7078244c39600f58e9\` (\`branch_id\`), INDEX \`IDX_af6dd64e9d3d79c471898db3b7\` (\`catalog_id\`), INDEX \`IDX_86b36c57ff85a98ce2ffb5834a\` (\`category\`), INDEX \`IDX_e036899ee8a748a0ed6e1c4a0d\` (\`adjustment_date\`), INDEX \`IDX_35738a7ed493f005d505e2d1c0\` (\`created_by_user_id\`), INDEX \`IDX_095afc5e97d25b9b4f8b11a7a7\` (\`payroll_period_id\`, \`category\`), INDEX \`IDX_93ea47d01dfeeae768f85ef9f5\` (\`payroll_period_id\`, \`branch_id\`), INDEX \`IDX_53a05b63fa68a997d14b69380f\` (\`payroll_period_id\`, \`employee_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` ADD CONSTRAINT \`FK_dc93cea538476131e14a1aefa45\` FOREIGN KEY (\`payroll_period_id\`) REFERENCES \`payroll_periods\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` ADD CONSTRAINT \`FK_9b867b2752b2ffba2b316a7086d\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` ADD CONSTRAINT \`FK_9e2907bc7078244c39600f58e99\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` ADD CONSTRAINT \`FK_af6dd64e9d3d79c471898db3b78\` FOREIGN KEY (\`catalog_id\`) REFERENCES \`reward_penalty_catalogs\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` ADD CONSTRAINT \`FK_35738a7ed493f005d505e2d1c05\` FOREIGN KEY (\`created_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` DROP FOREIGN KEY \`FK_35738a7ed493f005d505e2d1c05\``);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` DROP FOREIGN KEY \`FK_af6dd64e9d3d79c471898db3b78\``);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` DROP FOREIGN KEY \`FK_9e2907bc7078244c39600f58e99\``);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` DROP FOREIGN KEY \`FK_9b867b2752b2ffba2b316a7086d\``);
        await queryRunner.query(`ALTER TABLE \`payroll_adjustments\` DROP FOREIGN KEY \`FK_dc93cea538476131e14a1aefa45\``);
        await queryRunner.query(`DROP INDEX \`IDX_53a05b63fa68a997d14b69380f\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_93ea47d01dfeeae768f85ef9f5\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_095afc5e97d25b9b4f8b11a7a7\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_35738a7ed493f005d505e2d1c0\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_e036899ee8a748a0ed6e1c4a0d\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_86b36c57ff85a98ce2ffb5834a\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_af6dd64e9d3d79c471898db3b7\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_9e2907bc7078244c39600f58e9\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_9b867b2752b2ffba2b316a7086\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_dc93cea538476131e14a1aefa4\` ON \`payroll_adjustments\``);
        await queryRunner.query(`DROP TABLE \`payroll_adjustments\``);
    }

}
