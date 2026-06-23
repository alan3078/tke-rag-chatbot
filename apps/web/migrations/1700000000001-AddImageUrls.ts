import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrls1700000000001 implements MigrationInterface {
  name = "AddImageUrls1700000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles"
      ADD COLUMN IF NOT EXISTS "image_urls" JSONB DEFAULT '[]'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles"
      DROP COLUMN IF EXISTS "image_urls"
    `);
  }
}
