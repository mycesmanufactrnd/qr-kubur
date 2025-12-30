import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneNo1767067361251 implements MigrationInterface {
    name = 'AddPhoneNo1767067361251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneno" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneno"`);
    }

}
