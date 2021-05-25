import { MigrationInterface, QueryRunner } from 'typeorm';

export class addTogglTokenColumnInUsers1621866295028 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users ADD COLUMN toggl_token varchar(40)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users DROP COLUMN toggl_token`);
    }
}
