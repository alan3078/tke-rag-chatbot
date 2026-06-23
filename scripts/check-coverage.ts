// =============================================================================
// Coverage Check: Verify crawl completeness
// =============================================================================
// Usage: npx tsx scripts/check-coverage.ts
// =============================================================================

import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article } from "../apps/web/entities/article.entity";
import { Chunk } from "../apps/web/entities/chunk.entity";

const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Article, Chunk],
  synchronize: false,
  logging: false,
});

async function main() {
  await dataSource.initialize();

  console.log("=== Corpus Coverage Report ===\n");

  // Total articles
  const totalArticles = await dataSource.getRepository(Article).count();
  console.log(`Total articles: ${totalArticles}`);

  // Articles per section
  const sections = await dataSource
    .getRepository(Article)
    .createQueryBuilder("article")
    .select("article.section", "section")
    .addSelect("COUNT(*)", "count")
    .groupBy("article.section")
    .orderBy("count", "DESC")
    .getRawMany();

  console.log("\nArticles by section:");
  for (const s of sections) {
    console.log(`  ${s.section ?? "(no section)"}: ${s.count}`);
  }

  // Total chunks
  const totalChunks = await dataSource.getRepository(Chunk).count();
  console.log(`\nTotal chunks: ${totalChunks}`);

  // Articles without chunks
  const articlesWithoutChunks = await dataSource
    .getRepository(Article)
    .createQueryBuilder("article")
    .leftJoin("article.chunks", "chunk")
    .where("chunk.id IS NULL")
    .getCount();
  console.log(`Articles without chunks: ${articlesWithoutChunks}`);

  // Average chunks per article
  if (totalArticles > 0) {
    console.log(`Average chunks per article: ${(totalChunks / totalArticles).toFixed(1)}`);
  }

  // Chunks without embeddings
  const result = await dataSource.query(
    `SELECT COUNT(*) as count FROM chunks WHERE embedding IS NULL`,
  );
  console.log(`Chunks without embeddings: ${result[0].count}`);

  console.log("\n=== End Report ===");
  await dataSource.destroy();
}

main().catch((err) => {
  console.error("Coverage check failed:", err);
  process.exit(1);
});
