import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAttendances1783715503158 implements MigrationInterface {
    name = 'CreateAttendances1783715503158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`attendance_adjustments\` (\`id\` varchar(36) NOT NULL, \`attendance_id\` varchar(36) NOT NULL, \`adjusted_by\` int NOT NULL, \`action_type\` enum ('MANUAL_CREATE', 'ADJUST_TIME') NOT NULL, \`old_status\` enum ('CHECKED_IN', 'PENDING_CONFIRMATION', 'CONFIRMED', 'ABSENT') NULL, \`new_status\` enum ('CHECKED_IN', 'PENDING_CONFIRMATION', 'CONFIRMED', 'ABSENT') NULL, \`old_check_in_at\` datetime NULL, \`new_check_in_at\` datetime NULL, \`old_check_out_at\` datetime NULL, \`new_check_out_at\` datetime NULL, \`old_worked_minutes\` int NULL, \`new_worked_minutes\` int NULL, \`old_late_minutes\` int NULL, \`new_late_minutes\` int NULL, \`old_early_leave_minutes\` int NULL, \`new_early_leave_minutes\` int NULL, \`old_overtime_minutes\` int NULL, \`new_overtime_minutes\` int NULL, \`reason\` text NOT NULL, \`note\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_4e5d6c5d8c50cf61318f504ce4\` (\`attendance_id\`), INDEX \`IDX_6a158256940fd412fc9c964eeb\` (\`adjusted_by\`), INDEX \`IDX_64a04524dfad4b693bda2b9473\` (\`action_type\`), INDEX \`IDX_6daa58a6fb4b95e47bffe1f0ad\` (\`attendance_id\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`attendances\` (\`id\` varchar(36) NOT NULL, \`work_schedule_id\` varchar(36) NOT NULL, \`employee_id\` varchar(36) NOT NULL, \`branch_id\` varchar(36) NOT NULL, \`position_id\` varchar(36) NOT NULL, \`work_shift_id\` varchar(36) NOT NULL, \`schedule_date\` date NOT NULL, \`scheduled_start_at\` datetime NOT NULL, \`scheduled_end_at\` datetime NOT NULL, \`break_minutes\` int NOT NULL DEFAULT '0', \`grace_minutes\` int NOT NULL DEFAULT '0', \`check_in_at\` datetime NULL, \`check_out_at\` datetime NULL, \`late_minutes\` int NOT NULL DEFAULT '0', \`early_leave_minutes\` int NOT NULL DEFAULT '0', \`overtime_minutes\` int NOT NULL DEFAULT '0', \`worked_minutes\` int NOT NULL DEFAULT '0', \`status\` enum ('CHECKED_IN', 'PENDING_CONFIRMATION', 'CONFIRMED', 'ABSENT') NOT NULL DEFAULT 'CHECKED_IN', \`source\` enum ('EMPLOYEE_CHECK_IN', 'MANUAL', 'MARK_ABSENT') NOT NULL, \`absence_reason\` text NULL, \`note\` text NULL, \`confirmed_by\` int NULL, \`confirmed_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_43dca8b4751d7449a38b583991\` (\`employee_id\`), INDEX \`IDX_dc7f59ed9f70ec2c5e93066a21\` (\`branch_id\`), INDEX \`IDX_a55b125928ee1418ea9cb1324b\` (\`position_id\`), INDEX \`IDX_4f39695eeb6615f8f835e998a9\` (\`work_shift_id\`), INDEX \`IDX_0308c10d4bf4507fa192da9685\` (\`schedule_date\`), INDEX \`IDX_5a742b3e1f3a49970a74519ec8\` (\`scheduled_start_at\`), INDEX \`IDX_d0419e90d7d32e1495f93a6033\` (\`scheduled_end_at\`), INDEX \`IDX_69fb1c5e3dc1d2f3171f6e6025\` (\`status\`), INDEX \`IDX_263f105dbde0eb4880d07d4c8f\` (\`source\`), INDEX \`IDX_3b841eabc0b03b7862437653cc\` (\`confirmed_by\`), INDEX \`IDX_24412e6be595d641c6a7d4b51d\` (\`status\`, \`schedule_date\`), INDEX \`IDX_2bcde49b0f4ee299f394e79a4e\` (\`branch_id\`, \`schedule_date\`), INDEX \`IDX_e155955c9928ba835f01d84830\` (\`employee_id\`, \`schedule_date\`), UNIQUE INDEX \`REL_f4280375b005af67a3780912dd\` (\`work_schedule_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`attendance_adjustments\` ADD CONSTRAINT \`FK_4e5d6c5d8c50cf61318f504ce4b\` FOREIGN KEY (\`attendance_id\`) REFERENCES \`attendances\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendance_adjustments\` ADD CONSTRAINT \`FK_6a158256940fd412fc9c964eebf\` FOREIGN KEY (\`adjusted_by\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_f4280375b005af67a3780912dde\` FOREIGN KEY (\`work_schedule_id\`) REFERENCES \`work_schedules\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_43dca8b4751d7449a38b583991c\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_dc7f59ed9f70ec2c5e93066a211\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_a55b125928ee1418ea9cb1324b9\` FOREIGN KEY (\`position_id\`) REFERENCES \`positions\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_4f39695eeb6615f8f835e998a9c\` FOREIGN KEY (\`work_shift_id\`) REFERENCES \`work_shifts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_3b841eabc0b03b7862437653cc4\` FOREIGN KEY (\`confirmed_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_3b841eabc0b03b7862437653cc4\``);
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_4f39695eeb6615f8f835e998a9c\``);
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_a55b125928ee1418ea9cb1324b9\``);
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_dc7f59ed9f70ec2c5e93066a211\``);
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_43dca8b4751d7449a38b583991c\``);
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_f4280375b005af67a3780912dde\``);
        await queryRunner.query(`ALTER TABLE \`attendance_adjustments\` DROP FOREIGN KEY \`FK_6a158256940fd412fc9c964eebf\``);
        await queryRunner.query(`ALTER TABLE \`attendance_adjustments\` DROP FOREIGN KEY \`FK_4e5d6c5d8c50cf61318f504ce4b\``);
        await queryRunner.query(`DROP INDEX \`REL_f4280375b005af67a3780912dd\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_e155955c9928ba835f01d84830\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_2bcde49b0f4ee299f394e79a4e\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_24412e6be595d641c6a7d4b51d\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_3b841eabc0b03b7862437653cc\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_263f105dbde0eb4880d07d4c8f\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_69fb1c5e3dc1d2f3171f6e6025\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_d0419e90d7d32e1495f93a6033\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_5a742b3e1f3a49970a74519ec8\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_0308c10d4bf4507fa192da9685\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_4f39695eeb6615f8f835e998a9\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_a55b125928ee1418ea9cb1324b\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_dc7f59ed9f70ec2c5e93066a21\` ON \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_43dca8b4751d7449a38b583991\` ON \`attendances\``);
        await queryRunner.query(`DROP TABLE \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_6daa58a6fb4b95e47bffe1f0ad\` ON \`attendance_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_64a04524dfad4b693bda2b9473\` ON \`attendance_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_6a158256940fd412fc9c964eeb\` ON \`attendance_adjustments\``);
        await queryRunner.query(`DROP INDEX \`IDX_4e5d6c5d8c50cf61318f504ce4\` ON \`attendance_adjustments\``);
        await queryRunner.query(`DROP TABLE \`attendance_adjustments\``);
    }

}
