import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkSchedules1783086851192 implements MigrationInterface {
    name = 'CreateWorkSchedules1783086851192'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`work_schedules\` (\`id\` varchar(36) NOT NULL, \`employee_id\` varchar(36) NOT NULL, \`branch_id\` varchar(36) NOT NULL, \`position_id\` varchar(36) NOT NULL, \`work_shift_id\` varchar(36) NOT NULL, \`work_date\` date NOT NULL, \`shift_code_snapshot\` varchar(50) NOT NULL, \`shift_name_snapshot\` varchar(50) NOT NULL, \`start_time_snapshot\` time NOT NULL, \`end_time_snapshot\` time NOT NULL, \`break_minutes_snapshot\` int NOT NULL, \`note\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_377917cadaa1563e419732f6de\` (\`work_shift_id\`), INDEX \`IDX_cd2671163c66d9ea51c6a0df59\` (\`work_date\`), INDEX \`IDX_9fbcf6ea7c0de0a2844dc03fa0\` (\`position_id\`, \`work_date\`), INDEX \`IDX_0719ce218c52d6e292f60430b5\` (\`branch_id\`, \`work_date\`), UNIQUE INDEX \`IDX_22ee193b2afcc5e362ae43869f\` (\`employee_id\`, \`work_date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` ADD CONSTRAINT \`FK_5511ff2ad045b4ed6972905f40b\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` ADD CONSTRAINT \`FK_a94e22ba53a82e03f1325331b0b\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` ADD CONSTRAINT \`FK_5eaf85bf42a6cc3f7a308e02704\` FOREIGN KEY (\`position_id\`) REFERENCES \`positions\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` ADD CONSTRAINT \`FK_377917cadaa1563e419732f6de8\` FOREIGN KEY (\`work_shift_id\`) REFERENCES \`work_shifts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`work_schedules\` DROP FOREIGN KEY \`FK_377917cadaa1563e419732f6de8\``);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` DROP FOREIGN KEY \`FK_5eaf85bf42a6cc3f7a308e02704\``);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` DROP FOREIGN KEY \`FK_a94e22ba53a82e03f1325331b0b\``);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` DROP FOREIGN KEY \`FK_5511ff2ad045b4ed6972905f40b\``);
        await queryRunner.query(`DROP INDEX \`IDX_22ee193b2afcc5e362ae43869f\` ON \`work_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_0719ce218c52d6e292f60430b5\` ON \`work_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_9fbcf6ea7c0de0a2844dc03fa0\` ON \`work_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_cd2671163c66d9ea51c6a0df59\` ON \`work_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_377917cadaa1563e419732f6de\` ON \`work_schedules\``);
        await queryRunner.query(`DROP TABLE \`work_schedules\``);
    }

}
