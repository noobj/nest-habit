import { MigrationInterface, QueryRunner } from 'typeorm';

export class addRefreshTokenColumnInUsers1624955064220 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users ADD COLUMN refresh_token varchar(225)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users DROP COLUMN refresh_token`);
    }
}
