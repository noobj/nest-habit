import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class addProjectIdInProjectsTables1623650812987 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('daily_summaries');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('project_id') !== -1
        );
        await queryRunner.dropForeignKey('daily_summaries', foreignKey);
        await queryRunner.query(
            'ALTER TABLE projects MODIFY COLUMN id int auto_increment NOT NULL'
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
        await queryRunner.query(
            'ALTER TABLE projects ADD project_id INTEGER UNSIGNED NOT NULL'
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('daily_summaries');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('project_id') !== -1
        );
        await queryRunner.dropForeignKey('daily_summaries', foreignKey);
        await queryRunner.query(
            'ALTER TABLE projects MODIFY COLUMN id int NOT NULL'
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
        await queryRunner.query('ALTER TABLE projects DROP COLUMN project_id');
    }
}
