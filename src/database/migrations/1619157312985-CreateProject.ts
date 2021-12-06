import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProject1619157312985 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'projects',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '50'
                    }
                ]
            }),
            true
        );

        await queryRunner.createIndex(
            'projects',
            new TableIndex({
                name: 'uni_name',
                columnNames: ['name'],
                isUnique: true
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('projects', 'uni_name');
        await queryRunner.dropTable('projects');
    }
}
