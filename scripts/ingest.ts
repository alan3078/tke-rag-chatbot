// =============================================================================
// Ingestion Pipeline: Chunk → Embed → Store
// =============================================================================
// Processes all articles in the database:
//   1. Load articles that haven't been chunked yet
//   2. Chunk each article (Chinese-aware paragraph chunking)
//   3. Generate embeddings for all chunks (batched)
//   4. Store chunks + embeddings in database via TypeORM raw SQL
// =============================================================================
// Usage: npx tsx scripts/ingest.ts
// =============================================================================

import "dotenv/config";
import "reflect-metadata";
import { DataSource, IsNull } from "typeorm";
import pgvector from "pgvector";
import { Article } from "../apps/web/entities/article.entity";
import { Chunk } from "../apps/web/entities/chunk.entity";
import { createChunks } from "../apps/web/lib/chunking";
import { generateEmbeddings } from "../apps/web/lib/embeddings";

const EMBEDDING_BATCH_SIZE = 50;

// --- Database Connection ---
const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Article, Chunk],
  synchronize: false,
  logging: false,
});

async function main() {
  console.log("Initializing database connection...");
  await dataSource.initialize();

  const articleRepo = dataSource.getRepository(Article);
  const queryRunner = dataSource.createQueryRunner();

  console.log("Starting ingestion pipeline...\n");

  // 1. Find articles that haven't been chunked yet
  const articles = await articleRepo
    .createQueryBuilder("article")
    .leftJoin("article.chunks", "chunk")
    .where("chunk.id IS NULL")
    .orderBy("article.id", "ASC")
    .getMany();

  console.log(`Found ${articles.length} articles to process.\n`);

  let totalChunks = 0;

  for (const article of articles) {
    console.log(`Processing: ${article.title}`);

    // 2. Chunk the article
    const chunks = createChunks(article.id, article.body, {
      title: article.title,
      section: article.section,
      publishedDate: article.publishedDate
        ? article.publishedDate.toISOString().split("T")[0]
        : null,
    });

    if (chunks.length === 0) {
      console.log("  [skip] No chunks generated");
      continue;
    }

    // 3. Generate embeddings in batches
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings: number[][] = [];

    for (let i = 0; i < chunkTexts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunkTexts.slice(i, i + EMBEDDING_BATCH_SIZE);
      const batchEmbeddings = await generateEmbeddings(batch);
      embeddings.push(...batchEmbeddings);
    }

    // 4. Store chunks with embeddings using raw SQL (for vector type)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const embeddingSql = pgvector.toSql(embedding);

      // TODO: Add nodejieba segmentation for content_segmented
      await queryRunner.query(
        `INSERT INTO chunks (article_id, chunk_index, content, content_segmented, embedding, token_count, created_at)
         VALUES ($1, $2, $3, $4, $5::vector, $6, NOW())`,
        [
          chunk.articleId,
          chunk.chunkIndex,
          chunk.content,
          chunk.content, // placeholder: use jieba-segmented text here
          embeddingSql,
          chunk.tokenCount,
        ]
      );
    }

    totalChunks += chunks.length;
    console.log(`  Created ${chunks.length} chunks`);
  }

  console.log(`\nIngestion complete. Total chunks created: ${totalChunks}`);
  await dataSource.destroy();
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
