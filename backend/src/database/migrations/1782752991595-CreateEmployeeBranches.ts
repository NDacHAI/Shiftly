import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmployeeBranches1782752991595 implements MigrationInterface {
    name = 'CreateEmployeeBranches1782752991595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasEmployeeBranches = await queryRunner.hasTable('employee_branches');

        if (!hasEmployeeBranches) {
            await queryRunner.query(`CREATE TABLE \`employee_branches\` (\`employee_id\` varchar(36) NOT NULL, \`branch_id\` varchar(36) NOT NULL, INDEX \`IDX_77a02ddcd5a528f1664a883dc1\` (\`employee_id\`), INDEX \`IDX_83152ee2320a92aaa58dba4601\` (\`branch_id\`), PRIMARY KEY (\`employee_id\`, \`branch_id\`)) ENGINE=InnoDB`);
        }

        const employeeBranches = await queryRunner.getTable('employee_branches');
        const employeeForeignKey = employeeBranches?.foreignKeys.find(
            (foreignKey) => foreignKey.name === 'FK_employee_branches_employee',
        );
        const branchForeignKey = employeeBranches?.foreignKeys.find(
            (foreignKey) => foreignKey.name === 'FK_employee_branches_branch',
        );

        // On a fresh database `employees` is created later (CreateEmployees1783000000000),
        // which adds this foreign key itself once the table exists.
        if (!employeeForeignKey && (await queryRunner.hasTable('employees'))) {
            await queryRunner.query(`ALTER TABLE \`employee_branches\` ADD CONSTRAINT \`FK_employee_branches_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        }

        if (!branchForeignKey) {
            await queryRunner.query(`ALTER TABLE \`employee_branches\` ADD CONSTRAINT \`FK_employee_branches_branch\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`employee_branches\` DROP FOREIGN KEY \`FK_employee_branches_branch\``);
        const employeeBranches = await queryRunner.getTable('employee_branches');
        const employeeForeignKey = employeeBranches?.foreignKeys.find(
            (foreignKey) => foreignKey.name === 'FK_employee_branches_employee',
        );

        if (employeeForeignKey) {
            await queryRunner.dropForeignKey('employee_branches', employeeForeignKey);
        }
        await queryRunner.query(`DROP INDEX \`IDX_83152ee2320a92aaa58dba4601\` ON \`employee_branches\``);
        await queryRunner.query(`DROP INDEX \`IDX_77a02ddcd5a528f1664a883dc1\` ON \`employee_branches\``);
        await queryRunner.query(`DROP TABLE \`employee_branches\``);
    }

}
