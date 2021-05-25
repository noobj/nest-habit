import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from 'typeorm';

export class addUserIdColumnInProjects1621914428704 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE projects ADD COLUMN user_id int NOT NULL`);

        await queryRunner.createForeignKey(
            'projects',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.dropIndex('projects', 'uni_name');

        await queryRunner.createIndex(
            'projects',
            new TableIndex({
                name: 'uni_name_user',
                columnNames: ['name', 'user_id'],
                isUnique: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('projects', 'uni_name_user');

        await queryRunner.createIndex(
            'projects',
            new TableIndex({
                name: 'uni_name',
                columnNames: ['name'],
                isUnique: true,
            })
        );

        const table = await queryRunner.getTable('projects');
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('user_id') !== -1
        );
        await queryRunner.dropForeignKey('projects', foreignKey);

        await queryRunner.query(`ALTER TABLE projects DROP COLUMN user_id`);
    }
}
