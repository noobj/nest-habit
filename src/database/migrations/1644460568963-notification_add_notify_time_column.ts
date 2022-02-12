import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from 'typeorm';

export class notificationAddNotifyTimeColumn1644460568963 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE notifications ADD COLUMN notify_time time NOT NULL DEFAULT '9:0'`
        );

        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'uni_user_notifyid',
                columnNames: ['user_id', 'notify_id'],
                isUnique: true
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE notifications DROP COLUMN notify_time`);
        const table = await queryRunner.getTable('notifications');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('user_id') !== -1
        );
        await queryRunner.dropForeignKey('notifications', foreignKey);

        await queryRunner.dropIndex('notifications', 'uni_user_notifyid');
        await queryRunner.createForeignKey(
            'notifications',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE'
            })
        );
    }
}
