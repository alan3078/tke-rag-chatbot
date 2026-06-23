/**
 * Run TypeORM migrations programmatically.
 * Usage: npm run migration:run
 */
import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article } from "../entities/article.entity";
import { Chunk } from "../entities/chunk.entity";
import { InitialSchema1700000000000 } from "../migrations/1700000000000-InitialSchema";
import { AddImageUrls1700000000001 } from "../migrations/1700000000001-AddImageUrls";

async function main() {
  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Article, Chunk],
    migrations: [InitialSchema1700000000000, AddImageUrls1700000000001],
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();
  console.log("Running migrations...");
  await dataSource.runMigrations();
  console.log("Migrations complete.");
  await dataSource.destroy();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
