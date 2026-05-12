import type { MigrationInterface, QueryRunner } from "typeorm";

export class StoredFileUploadedByJson1778565646261 implements MigrationInterface {
  name = "StoredFileUploadedByJson1778565646261";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stored_file"
      ADD COLUMN IF NOT EXISTS "uploadedBy" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "stored_file"
      DROP COLUMN IF EXISTS "uploadedById"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stored_file"
      ADD COLUMN IF NOT EXISTS "uploadedById" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "stored_file"
      DROP COLUMN IF EXISTS "uploadedBy"
    `);
  }
}

