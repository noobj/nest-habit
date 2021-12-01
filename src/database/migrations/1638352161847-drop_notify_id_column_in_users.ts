import { MigrationInterface, QueryRunner } from 'typeorm';

export class dropNotifyIdColumnInUsers1638352161847 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE habbit.users DROP COLUMN notify_id;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE users ADD COLUMN notify_id varchar(50) COMMENT 'the notify service id e.g. telegram user chat_id'`
        );
    }
}
