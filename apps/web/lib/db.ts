import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article } from "@/entities/article.entity";
import { Chunk } from "@/entities/chunk.entity";

// =============================================================================
// TypeORM DataSource Singleton
// =============================================================================
// Prevents multiple connections during Next.js HMR in development.
// Uses globalThis to survive hot module reloading.
// =============================================================================

function createDataSource(): DataSource {
  return new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Article, Chunk],
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : false,
    extra: {
      max: 10,
      idleTimeoutMillis: 30000,
    },
  });
}

const globalForTypeORM = globalThis as unknown as {
  dataSource: DataSource | undefined;
  dataSourcePromise: Promise<DataSource> | undefined;
};

/**
 * Get the initialized DataSource singleton.
 * Safe to call from API routes and server components.
 */
export async function getDataSource(): Promise<DataSource> {
  if (globalForTypeORM.dataSource?.isInitialized) {
    return globalForTypeORM.dataSource;
  }

  if (!globalForTypeORM.dataSourcePromise) {
    const ds = createDataSource();
    globalForTypeORM.dataSourcePromise = ds.initialize().then((initialized) => {
      globalForTypeORM.dataSource = initialized;
      return initialized;
    });
  }

  return globalForTypeORM.dataSourcePromise;
}
