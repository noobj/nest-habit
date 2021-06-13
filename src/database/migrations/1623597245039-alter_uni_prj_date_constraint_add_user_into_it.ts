import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from 'typeorm';

export class alterUniPrjDateConstraintAddUserIntoIt1623597245039
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('daily_summaries');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('project_id') !== -1
        );
        await queryRunner.dropForeignKey('daily_summaries', foreignKey);
        await queryRunner.dropIndex('daily_summaries', 'uni_prj_date');
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
                name: 'uni_prj_date_user',
                columnNames: ['project_id', 'date', 'user_id'],
                isUnique: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('daily_summaries', 'uni_prj_date_user');
        await queryRunner.createIndex(
            'daily_summaries',
            new TableIndex({
                name: 'uni_prj_date',
                columnNames: ['project_id', 'date'],
                isUnique: true,
            })
        );
    }
}
