import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgvector extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Create articles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "articles" (
        "id" SERIAL PRIMARY KEY,
        "url" TEXT NOT NULL UNIQUE,
        "title" TEXT NOT NULL,
        "section" TEXT,
        "published_date" DATE,
        "summary" TEXT,
        "body" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create chunks table with vector column
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chunks" (
        "id" SERIAL PRIMARY KEY,
        "article_id" INT NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
        "chunk_index" INT NOT NULL,
        "content" TEXT NOT NULL,
        "content_segmented" TEXT,
        "embedding" vector(1024),
        "token_count" INT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Index: foreign key on article_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_chunks_article_id"
      ON "chunks" ("article_id")
    `);

    // Index: HNSW vector similarity search (cosine)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_chunks_embedding_hnsw"
      ON "chunks"
      USING hnsw ("embedding" vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);

    // Index: GIN for full-text keyword search on segmented content
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_chunks_content_gin"
      ON "chunks"
      USING gin (to_tsvector('simple', COALESCE("content_segmented", "content")))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chunks_content_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chunks_embedding_hnsw"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chunks_article_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chunks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "articles"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
  }
}
