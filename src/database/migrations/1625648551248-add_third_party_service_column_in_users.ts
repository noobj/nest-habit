import { MigrationInterface, QueryRunner } from 'typeorm';

export class addThirdPartyServiceColumnInUsers1625648551248
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE users ADD COLUMN third_party_service ENUM('toggl') COMMENT 'Which tracking service the user using'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users DROP COLUMN third_party_service`);
    }
}
