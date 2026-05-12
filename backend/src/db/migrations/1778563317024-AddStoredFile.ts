import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoredFile1778563317024 implements MigrationInterface {
  name = "AddStoredFile1778563317024";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stored_file" (
        "id" SERIAL NOT NULL,
        "bucket" character varying(128) NOT NULL,
        "key" character varying(512) NOT NULL,
        "originalName" character varying(255),
        "contentType" character varying(255),
        "sizeBytes" integer,
        "createdat" TIMESTAMP NOT NULL DEFAULT now(),
        "uploadedById" integer,
        CONSTRAINT "PK_stored_file_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stored_file_bucket_key" UNIQUE ("bucket", "key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stored_file"`);
  }
}

