import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class createUsersTable1618911574991 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'account',
                        type: 'varchar',
                        length: '50'
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '100'
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        length: '225'
                    }
                ]
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users');
    }
}
