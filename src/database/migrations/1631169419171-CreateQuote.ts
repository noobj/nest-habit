import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateQuote1631169419171 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'quotes',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'text',
                        type: 'text'
                    },
                    {
                        name: 'author',
                        type: 'varchar',
                        length: '50'
                    }
                ]
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('quotes');
    }
}
