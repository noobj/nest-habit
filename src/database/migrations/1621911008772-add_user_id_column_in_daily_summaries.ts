import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class addUserIdColumnInDailySummaries1621911008772 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE daily_summaries ADD COLUMN user_id int NOT NULL`
        );

        await queryRunner.createForeignKey(
            'daily_summaries',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE'
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('daily_summaries');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('user_id') !== -1
        );
        await queryRunner.dropForeignKey('daily_summaries', foreignKey);

        await queryRunner.query(`ALTER TABLE daily_summaries DROP COLUMN user_id`);
    }
}
