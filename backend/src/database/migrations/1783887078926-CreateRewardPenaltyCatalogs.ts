import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRewardPenaltyCatalogs1783887078926 implements MigrationInterface {
    name = 'CreateRewardPenaltyCatalogs1783887078926'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`reward_penalty_catalogs\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(50) NOT NULL, \`name\` varchar(255) NOT NULL, \`category\` tinyint NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`description\` text NULL, \`status\` tinyint NOT NULL DEFAULT '1', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_6ebed33484c991a60082974152\` (\`code\`), INDEX \`IDX_c434171d6d437ad9159a6f20aa\` (\`category\`), INDEX \`IDX_e4d2839712595425d49c69b788\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_e4d2839712595425d49c69b788\` ON \`reward_penalty_catalogs\``);
        await queryRunner.query(`DROP INDEX \`IDX_c434171d6d437ad9159a6f20aa\` ON \`reward_penalty_catalogs\``);
        await queryRunner.query(`DROP INDEX \`IDX_6ebed33484c991a60082974152\` ON \`reward_penalty_catalogs\``);
        await queryRunner.query(`DROP TABLE \`reward_penalty_catalogs\``);
    }

}
