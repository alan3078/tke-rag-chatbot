import { describe, expect, it } from "vitest";
import { getMetadataArgsStorage } from "typeorm";
import { EMBEDDING_DIMENSIONS } from "@/lib/constants";
import { Chunk } from "@/entities/chunk.entity";
import { InitialSchema1700000000000 } from "@/migrations/1700000000000-InitialSchema";

describe("embedding dimension configuration", () => {
  it("defaults EMBEDDING_DIMENSIONS to 1024", () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1024);
  });

  it("keeps the Chunk entity vector column in sync with EMBEDDING_DIMENSIONS", () => {
    const metadataArgsStorage = getMetadataArgsStorage();
    const embeddingColumn = metadataArgsStorage.columns.find(
      (column) => column.target === Chunk && column.propertyName === "embedding",
    );

    expect(embeddingColumn?.options.length).toBe(EMBEDDING_DIMENSIONS);
  });

  it("builds fresh databases with vector(1024) in the initial schema", async () => {
    const migration = new InitialSchema1700000000000();
    const queries: string[] = [];
    const queryRunner = {
      query: async (sql: string) => {
        queries.push(sql);
      },
    };

    await migration.up(queryRunner as never);

    expect(queries.some((sql) => sql.includes('"embedding" vector(1024)'))).toBe(true);
  });
});
