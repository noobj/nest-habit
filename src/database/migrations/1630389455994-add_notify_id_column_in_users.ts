import { MigrationInterface, QueryRunner } from 'typeorm';

export class addNotifyIdColumnInUsers1630389455994 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE users ADD COLUMN notify_id varchar(50) COMMENT 'the notify service id e.g. telegram user chat_id'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users DROP COLUMN notify_id`);
    }
}
