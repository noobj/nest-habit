import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class addUniNameConstraintInUserTable1621921048626 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'uni_name',
                columnNames: ['account'],
                isUnique: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('users', 'uni_name');
    }
}
