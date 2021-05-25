import { MigrationInterface, QueryRunner } from 'typeorm';

export class addLastUpdatedInProjectsTable1621928295390 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE projects ADD COLUMN last_updated timestamp NOT NULL DEFAULT NOW()`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE projects DROP COLUMN last_updated`);
    }
}
