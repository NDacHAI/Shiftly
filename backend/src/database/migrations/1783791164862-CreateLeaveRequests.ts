import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeaveRequests1783791164862 implements MigrationInterface {
    name = 'CreateLeaveRequests1783791164862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`leave_request_assignments\` (\`id\` varchar(36) NOT NULL, \`leave_request_id\` varchar(36) NOT NULL, \`work_schedule_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_f34767bdb476da22e3da3d3445\` (\`leave_request_id\`), INDEX \`IDX_a63b3208fe46ac2398ca6764ba\` (\`work_schedule_id\`), UNIQUE INDEX \`IDX_38db146afb4a279adcb113c288\` (\`leave_request_id\`, \`work_schedule_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`leave_requests\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(50) NOT NULL, \`employee_id\` varchar(36) NOT NULL, \`branch_id\` varchar(36) NOT NULL, \`request_mode\` enum ('DATE_TIME', 'SHIFT') NOT NULL, \`start_date\` date NULL, \`end_date\` date NULL, \`is_full_day\` tinyint NULL, \`start_time\` time NULL, \`end_time\` time NULL, \`reason\` text NOT NULL, \`status\` enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`created_by_user_id\` int NOT NULL, \`reviewed_by_user_id\` int NULL, \`review_note\` text NULL, \`reviewed_at\` datetime NULL, \`cancelled_by_user_id\` int NULL, \`cancel_reason\` text NULL, \`cancelled_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_8c5c4586626463382fa22fcd99\` (\`code\`), INDEX \`IDX_52b4b7c7d295e204add6dbe0a0\` (\`employee_id\`), INDEX \`IDX_5aeaf58bba3b637cb4460185ef\` (\`branch_id\`), INDEX \`IDX_7b6ca9109d963ec488e73efac7\` (\`request_mode\`), INDEX \`IDX_a9cc5df6df50aed58f4d84aa4f\` (\`status\`), INDEX \`IDX_e827c7977ae66e52811ea34f45\` (\`created_by_user_id\`), INDEX \`IDX_532dc7214793d7cf9b0fa1117f\` (\`reviewed_by_user_id\`), INDEX \`IDX_f806972f755b70fc9d8837c10d\` (\`cancelled_by_user_id\`), INDEX \`IDX_3b04f8f89861aa511f8ed8d95c\` (\`branch_id\`, \`status\`), INDEX \`IDX_64b609c7cb68931be7cbcc12b5\` (\`employee_id\`, \`start_date\`, \`end_date\`), INDEX \`IDX_83141eeaaef5a92fbab76b256e\` (\`employee_id\`, \`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`leave_request_assignments\` ADD CONSTRAINT \`FK_f34767bdb476da22e3da3d3445a\` FOREIGN KEY (\`leave_request_id\`) REFERENCES \`leave_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`leave_request_assignments\` ADD CONSTRAINT \`FK_a63b3208fe46ac2398ca6764ba3\` FOREIGN KEY (\`work_schedule_id\`) REFERENCES \`work_schedules\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` ADD CONSTRAINT \`FK_52b4b7c7d295e204add6dbe0a09\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` ADD CONSTRAINT \`FK_5aeaf58bba3b637cb4460185ef6\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` ADD CONSTRAINT \`FK_e827c7977ae66e52811ea34f45c\` FOREIGN KEY (\`created_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` ADD CONSTRAINT \`FK_532dc7214793d7cf9b0fa1117fa\` FOREIGN KEY (\`reviewed_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` ADD CONSTRAINT \`FK_f806972f755b70fc9d8837c10d4\` FOREIGN KEY (\`cancelled_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_f806972f755b70fc9d8837c10d4\``);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_532dc7214793d7cf9b0fa1117fa\``);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_e827c7977ae66e52811ea34f45c\``);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_5aeaf58bba3b637cb4460185ef6\``);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_52b4b7c7d295e204add6dbe0a09\``);
        await queryRunner.query(`ALTER TABLE \`leave_request_assignments\` DROP FOREIGN KEY \`FK_a63b3208fe46ac2398ca6764ba3\``);
        await queryRunner.query(`ALTER TABLE \`leave_request_assignments\` DROP FOREIGN KEY \`FK_f34767bdb476da22e3da3d3445a\``);
        await queryRunner.query(`DROP INDEX \`IDX_83141eeaaef5a92fbab76b256e\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_64b609c7cb68931be7cbcc12b5\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_3b04f8f89861aa511f8ed8d95c\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_f806972f755b70fc9d8837c10d\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_532dc7214793d7cf9b0fa1117f\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_e827c7977ae66e52811ea34f45\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_a9cc5df6df50aed58f4d84aa4f\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_7b6ca9109d963ec488e73efac7\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_5aeaf58bba3b637cb4460185ef\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_52b4b7c7d295e204add6dbe0a0\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_8c5c4586626463382fa22fcd99\` ON \`leave_requests\``);
        await queryRunner.query(`DROP TABLE \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_38db146afb4a279adcb113c288\` ON \`leave_request_assignments\``);
        await queryRunner.query(`DROP INDEX \`IDX_a63b3208fe46ac2398ca6764ba\` ON \`leave_request_assignments\``);
        await queryRunner.query(`DROP INDEX \`IDX_f34767bdb476da22e3da3d3445\` ON \`leave_request_assignments\``);
        await queryRunner.query(`DROP TABLE \`leave_request_assignments\``);
    }

}
