// =============================================================================
// Ingestion Pipeline: Hierarchical Chunk → Segment → Embed → Store
// =============================================================================
// Processes all articles in the database:
//   1. Load articles that haven't been chunked yet
//   2. Hierarchical chunking: L1 (article) + L2 (section) per ADR-0006
//   3. Chinese word segmentation via nodejieba for keyword search
//   4. Generate embeddings via Ollama qwen3-embedding:4b (local)
//   5. Store chunks with level, content_segmented, and embeddings
// =============================================================================
// Usage: npx tsx scripts/ingest.ts
// =============================================================================

import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import pgvector from "pgvector";
import { Article } from "../src/entities/article.entity";
import { Chunk } from "../src/entities/chunk.entity";
import { ChunkingService, type ChunkMetadata } from "../src/chunking/chunking.service";
import { normalizePublishedDate } from "../src/common/date-utils";
import { SegmentationService } from "../src/segmentation/segmentation.service";
import { EmbeddingsService } from "../src/embeddings/embeddings.service";
import { EMBEDDING_BATCH_SIZE } from "../src/embeddings/embeddings.constants";

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

  console.log("Starting ingestion pipeline (hierarchical L1+L2)...\n");

  // 1. Find articles that haven't been chunked yet
  const articles = await articleRepo
    .createQueryBuilder("article")
    .leftJoin("article.chunks", "chunk")
    .where("chunk.id IS NULL")
    .orderBy("article.id", "ASC")
    .getMany();

  console.log(`Found ${articles.length} articles to process.\n`);

  let totalL1 = 0;
  let totalL2 = 0;

  for (const article of articles) {
    console.log(`Processing [${article.id}]: ${article.title}`);

    // 2. Hierarchical chunking
    const metadata: ChunkMetadata = {
      title: article.title,
      section: article.section,
      publishedDate: normalizePublishedDate(article.publishedDate),
    };
    const chunks = new ChunkingService().chunkArticle(article.body, metadata);

    if (chunks.length === 0) {
      console.log("  [skip] No chunks generated (empty body)");
      continue;
    }

    // 3. Segment each chunk for keyword search
    const segService = new SegmentationService();
    const segmentedTexts = chunks.map((c) => segService.segmentText(c.content));

    // 4. Generate embeddings in batches
    const chunkTexts = chunks.map((c) => c.content);
    const embedService = new EmbeddingsService();
    const embeddings: number[][] = [];

    for (let i = 0; i < chunkTexts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunkTexts.slice(i, i + EMBEDDING_BATCH_SIZE);
      const batchEmbeddings = await embedService.generateEmbeddings(batch);
      embeddings.push(...batchEmbeddings);
    }

    // 5. Store chunks with level, segmented text, and embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embeddingSql = pgvector.toSql(embeddings[i]);

      await queryRunner.query(
        `INSERT INTO chunks (article_id, chunk_index, level, content, content_segmented, embedding, token_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::vector, $7, NOW())`,
        [
          article.id,
          chunk.chunkIndex,
          chunk.level,
          chunk.content,
          segmentedTexts[i],
          embeddingSql,
          chunk.tokenCount,
        ],
      );
    }

    const l1Count = chunks.filter((c) => c.level === 1).length;
    const l2Count = chunks.filter((c) => c.level === 2).length;
    totalL1 += l1Count;
    totalL2 += l2Count;

    console.log(`  L1: ${l1Count}, L2: ${l2Count} (total: ${chunks.length} chunks)`);
  }

  console.log(
    `\nIngestion complete. L1: ${totalL1}, L2: ${totalL2}, Total: ${totalL1 + totalL2} chunks`,
  );
  await dataSource.destroy();
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
