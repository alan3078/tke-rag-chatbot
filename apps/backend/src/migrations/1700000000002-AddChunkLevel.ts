import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChunkLevel1700000000002 implements MigrationInterface {
  name = "AddChunkLevel1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add level column: 1 = Article (L1), 2 = Section (L2)
    await queryRunner.query(
      `ALTER TABLE "chunks" ADD COLUMN IF NOT EXISTS "level" SMALLINT NOT NULL DEFAULT 1`,
    );

    // Index for filtering by level in retrieval queries
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chunks_level" ON "chunks" ("level")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chunks_level"`);
    await queryRunner.query(`ALTER TABLE "chunks" DROP COLUMN IF EXISTS "level"`);
  }
}
