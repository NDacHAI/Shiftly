import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalaryRules1783878269015 implements MigrationInterface {
    name = 'CreateSalaryRules1783878269015';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`salary_rules\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(50) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` tinyint NOT NULL DEFAULT '1', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_037eb08047aa5a5f39321cd00f\` (\`code\`), INDEX \`IDX_50b17aa002f0bd46a57b418d43\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`salary_rule_versions\` (\`id\` varchar(36) NOT NULL, \`salary_rule_id\` varchar(36) NOT NULL, \`multiplier\` decimal(5,2) NOT NULL, \`effective_from\` date NOT NULL, \`effective_to\` date NULL, \`note\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_55b99311d83ae81dd6e8ba1849\` (\`salary_rule_id\`), INDEX \`IDX_96d91e2a37ea2ce8dd0cd2761c\` (\`effective_from\`), INDEX \`IDX_1f92d803f1b0101e4d193f85e9\` (\`effective_to\`), UNIQUE INDEX \`IDX_e037401f50523035b4dbb8792f\` (\`salary_rule_id\`, \`effective_from\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`salary_rule_versions\` ADD CONSTRAINT \`FK_55b99311d83ae81dd6e8ba18492\` FOREIGN KEY (\`salary_rule_id\`) REFERENCES \`salary_rules\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`salary_rule_versions\` DROP FOREIGN KEY \`FK_55b99311d83ae81dd6e8ba18492\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_e037401f50523035b4dbb8792f\` ON \`salary_rule_versions\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_1f92d803f1b0101e4d193f85e9\` ON \`salary_rule_versions\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_96d91e2a37ea2ce8dd0cd2761c\` ON \`salary_rule_versions\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_55b99311d83ae81dd6e8ba1849\` ON \`salary_rule_versions\``,
        );
        await queryRunner.query(`DROP TABLE \`salary_rule_versions\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_50b17aa002f0bd46a57b418d43\` ON \`salary_rules\``,
        );
        await queryRunner.query(
            `DROP INDEX \`IDX_037eb08047aa5a5f39321cd00f\` ON \`salary_rules\``,
        );
        await queryRunner.query(`DROP TABLE \`salary_rules\``);
    }
}
