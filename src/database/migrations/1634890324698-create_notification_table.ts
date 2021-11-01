import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class createNotificationTable1634890324698 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'notifications',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'user_id',
                        type: 'int'
                    },
                    {
                        name: 'last_notify',
                        isNullable: true,
                        type: 'date'
                    },
                    {
                        name: 'notify_id',
                        type: 'varchar',
                        length: '50',
                        comment: 'the notify service id e.g. telegram user chat_id'
                    }
                ]
            }),
            true
        );

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

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('notifications');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('user_id') !== -1
        );
        await queryRunner.dropForeignKey('notifications', foreignKey);
        await queryRunner.dropTable('notifications');
    }
}
