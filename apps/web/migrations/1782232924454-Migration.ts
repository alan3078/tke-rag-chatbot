import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782232924454 implements MigrationInterface {
  name = "Migration1782232924454";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chunks" DROP CONSTRAINT "chunks_article_id_fkey"`);
    await queryRunner.query(`DROP INDEX "public"."idx_chunks_article_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_chunks_embedding_hnsw"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "articles_url_key"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_143e4ae40220e82a7829dee20e" ON "articles" ("url") `,
    );
    await queryRunner.query(
      `ALTER TABLE "chunks" ADD CONSTRAINT "FK_90f7e227dfd9b670974148d687f" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chunks" DROP CONSTRAINT "FK_90f7e227dfd9b670974148d687f"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_143e4ae40220e82a7829dee20e"`);
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "articles_url_key" UNIQUE ("url")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_chunks_embedding_hnsw" ON "chunks" ("embedding") `);
    await queryRunner.query(`CREATE INDEX "idx_chunks_article_id" ON "chunks" ("article_id") `);
    await queryRunner.query(
      `ALTER TABLE "chunks" ADD CONSTRAINT "chunks_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
