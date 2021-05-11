import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateDailySummary1620638269906 implements MigrationInterface {
    name = 'CreateDailySummary1620638269906';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'daily_summaries',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                    },
                    {
                        name: 'date',
                        type: 'char',
                        length: '10',
                    },
                    {
                        name: 'project_id',
                        type: 'int',
                    },
                    {
                        name: 'duration',
                        type: 'int',
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'daily_summaries',
            new TableForeignKey({
                columnNames: ['project_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'projects',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createIndex(
            'daily_summaries',
            new TableIndex({
                name: 'uni_prj_date',
                columnNames: ['project_id', 'date'],
                isUnique: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('daily_summaries');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('project_id') !== -1
        );
        await queryRunner.dropForeignKey('daily_summaries', foreignKey);
        await queryRunner.dropIndex('daily_summaries', 'uni_prj_date');
        await queryRunner.dropTable('daily_summaries');
    }
}
