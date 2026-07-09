import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateShiftRequests1783601122047 implements MigrationInterface {
    name = 'CreateShiftRequests1783601122047'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`shift_requests\` (\`id\` varchar(36) NOT NULL, \`employee_id\` varchar(36) NOT NULL, \`branch_id\` varchar(36) NOT NULL, \`position_id\` varchar(36) NOT NULL, \`work_shift_id\` varchar(36) NOT NULL, \`work_date\` date NOT NULL, \`status\` tinyint NOT NULL DEFAULT '0', \`employee_note\` text NULL, \`manager_note\` text NULL, \`reviewed_by\` int NULL, \`reviewed_at\` datetime NULL, \`cancelled_by\` int NULL, \`cancelled_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_daa4fb70bd0e46e583fcad8797\` (\`employee_id\`), INDEX \`IDX_b829e35743f08715e81ea62695\` (\`branch_id\`), INDEX \`IDX_80da4c4ed7de349e107f0838aa\` (\`position_id\`), INDEX \`IDX_3d2ff5f300aa288ceca43ffdb4\` (\`work_shift_id\`), INDEX \`IDX_cadc6be32cefce35d39c6b8d2c\` (\`work_date\`), INDEX \`IDX_2facfdf275cca1622494879f17\` (\`status\`), INDEX \`IDX_e882493277a290e6289bd6ec91\` (\`reviewed_by\`), INDEX \`IDX_42883f76ddd4c4a3fa892cf4c1\` (\`cancelled_by\`), INDEX \`IDX_7b82347250a3b913fdf3110ce3\` (\`employee_id\`, \`branch_id\`, \`position_id\`, \`work_shift_id\`, \`work_date\`, \`status\`), INDEX \`IDX_93e6363385878b564f147b5814\` (\`branch_id\`, \`work_date\`), INDEX \`IDX_2282f6124d9df3ba519ba1e08b\` (\`employee_id\`, \`work_date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` ADD CONSTRAINT \`FK_daa4fb70bd0e46e583fcad87974\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` ADD CONSTRAINT \`FK_b829e35743f08715e81ea62695a\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` ADD CONSTRAINT \`FK_80da4c4ed7de349e107f0838aa7\` FOREIGN KEY (\`position_id\`) REFERENCES \`positions\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` ADD CONSTRAINT \`FK_3d2ff5f300aa288ceca43ffdb46\` FOREIGN KEY (\`work_shift_id\`) REFERENCES \`work_shifts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` ADD CONSTRAINT \`FK_e882493277a290e6289bd6ec912\` FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` ADD CONSTRAINT \`FK_42883f76ddd4c4a3fa892cf4c1f\` FOREIGN KEY (\`cancelled_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`shift_requests\` DROP FOREIGN KEY \`FK_42883f76ddd4c4a3fa892cf4c1f\``);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` DROP FOREIGN KEY \`FK_e882493277a290e6289bd6ec912\``);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` DROP FOREIGN KEY \`FK_3d2ff5f300aa288ceca43ffdb46\``);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` DROP FOREIGN KEY \`FK_80da4c4ed7de349e107f0838aa7\``);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` DROP FOREIGN KEY \`FK_b829e35743f08715e81ea62695a\``);
        await queryRunner.query(`ALTER TABLE \`shift_requests\` DROP FOREIGN KEY \`FK_daa4fb70bd0e46e583fcad87974\``);
        await queryRunner.query(`DROP INDEX \`IDX_2282f6124d9df3ba519ba1e08b\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_93e6363385878b564f147b5814\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_7b82347250a3b913fdf3110ce3\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_42883f76ddd4c4a3fa892cf4c1\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_e882493277a290e6289bd6ec91\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_2facfdf275cca1622494879f17\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_cadc6be32cefce35d39c6b8d2c\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_3d2ff5f300aa288ceca43ffdb4\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_80da4c4ed7de349e107f0838aa\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_b829e35743f08715e81ea62695\` ON \`shift_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_daa4fb70bd0e46e583fcad8797\` ON \`shift_requests\``);
        await queryRunner.query(`DROP TABLE \`shift_requests\``);
    }

}
