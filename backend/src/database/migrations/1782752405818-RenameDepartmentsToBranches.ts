import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameDepartmentsToBranches1782752405818 implements MigrationInterface {
    name = 'RenameDepartmentsToBranches1782752405818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`positions\` DROP FOREIGN KEY \`FK_positions_department\``);
        await queryRunner.query(`DROP INDEX \`IDX_positions_department_id\` ON \`positions\``);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`department_id\` \`branch_id\` varchar(36) NOT NULL`);
        await queryRunner.query(`CREATE TABLE \`branches\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(20) NOT NULL, \`name\` varchar(100) NOT NULL, \`description\` text NULL, \`status\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_branches_code\` (\`code\`), UNIQUE INDEX \`IDX_branches_name\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE INDEX \`IDX_positions_branch_id\` ON \`positions\` (\`branch_id\`)`);
        await queryRunner.query(`ALTER TABLE \`positions\` ADD CONSTRAINT \`FK_positions_branch\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`positions\` DROP FOREIGN KEY \`FK_positions_branch\``);
        await queryRunner.query(`DROP INDEX \`IDX_positions_branch_id\` ON \`positions\``);
        await queryRunner.query(`DROP INDEX \`IDX_branches_name\` ON \`branches\``);
        await queryRunner.query(`DROP INDEX \`IDX_branches_code\` ON \`branches\``);
        await queryRunner.query(`DROP TABLE \`branches\``);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`branch_id\` \`department_id\` varchar(36) NOT NULL`);
        await queryRunner.query(`CREATE INDEX \`IDX_positions_department_id\` ON \`positions\` (\`department_id\`)`);
        await queryRunner.query(`ALTER TABLE \`positions\` ADD CONSTRAINT \`FK_positions_department\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
