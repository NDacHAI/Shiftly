import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShiftRequestSourceToWorkSchedules1783603325418 implements MigrationInterface {
    name = 'AddShiftRequestSourceToWorkSchedules1783603325418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`work_schedules\` ADD \`source\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` ADD \`shift_request_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` ADD UNIQUE INDEX \`IDX_ae01a1bf1ff67bbbd8df427a34\` (\`shift_request_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_b24f08ab4c66659548ea4017b8\` ON \`work_schedules\` (\`source\`)`);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` ADD CONSTRAINT \`FK_ae01a1bf1ff67bbbd8df427a34f\` FOREIGN KEY (\`shift_request_id\`) REFERENCES \`shift_requests\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`work_schedules\` DROP FOREIGN KEY \`FK_ae01a1bf1ff67bbbd8df427a34f\``);
        await queryRunner.query(`DROP INDEX \`IDX_b24f08ab4c66659548ea4017b8\` ON \`work_schedules\``);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` DROP INDEX \`IDX_ae01a1bf1ff67bbbd8df427a34\``);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` DROP COLUMN \`shift_request_id\``);
        await queryRunner.query(`ALTER TABLE \`work_schedules\` DROP COLUMN \`source\``);
    }

}
