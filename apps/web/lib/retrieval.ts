// =============================================================================
// Hybrid Retrieval: Vector Search + Keyword Search with RRF
// =============================================================================
// Uses Reciprocal Rank Fusion to combine:
//   - Semantic (vector) similarity via pgvector
//   - Keyword matching via PostgreSQL tsvector (pre-segmented Chinese)
// =============================================================================

import pgvector from "pgvector";
import { getDataSource } from "./db";
import { generateQueryEmbedding } from "./embeddings";
import { RRF_K, VECTOR_WEIGHT, KEYWORD_WEIGHT, FINAL_TOP_K } from "./constants";
import type { RetrievalResult } from "@/types";

export type { RetrievalResult };

/**
 * Perform hybrid retrieval: vector + keyword search with RRF fusion.
 */
export async function hybridSearch(
  query: string,
  limit: number = FINAL_TOP_K,
): Promise<RetrievalResult[]> {
  const ds = await getDataSource();

  // 1. Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);
  const embeddingSql = pgvector.toSql(queryEmbedding);

  // 2. Hybrid search with RRF
  const results = await ds.query(
    `
    WITH semantic_search AS (
      SELECT
        c.id AS chunk_id,
        c.article_id,
        c.content,
        a.title,
        a.url,
        a.section,
        a.published_date,
        RANK() OVER (ORDER BY c.embedding <=> $1::vector) AS rank
      FROM chunks c
      JOIN articles a ON a.id = c.article_id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $1::vector
      LIMIT 20
    ),
    keyword_search AS (
      SELECT
        c.id AS chunk_id,
        c.article_id,
        c.content,
        a.title,
        a.url,
        a.section,
        a.published_date,
        RANK() OVER (
          ORDER BY ts_rank_cd(
            to_tsvector('simple', COALESCE(c.content_segmented, c.content)),
            plainto_tsquery('simple', $2)
          ) DESC
        ) AS rank
      FROM chunks c
      JOIN articles a ON a.id = c.article_id
      WHERE to_tsvector('simple', COALESCE(c.content_segmented, c.content))
            @@ plainto_tsquery('simple', $2)
      ORDER BY ts_rank_cd(
        to_tsvector('simple', COALESCE(c.content_segmented, c.content)),
        plainto_tsquery('simple', $2)
      ) DESC
      LIMIT 20
    )
    SELECT
      COALESCE(ss.chunk_id, ks.chunk_id) AS "chunkId",
      COALESCE(ss.article_id, ks.article_id) AS "articleId",
      COALESCE(ss.content, ks.content) AS content,
      COALESCE(ss.title, ks.title) AS title,
      COALESCE(ss.url, ks.url) AS url,
      COALESCE(ss.section, ks.section) AS section,
      COALESCE(ss.published_date, ks.published_date) AS "publishedDate",
      (
        $3 * COALESCE(1.0 / ($4 + ss.rank), 0.0) +
        $5 * COALESCE(1.0 / ($4 + ks.rank), 0.0)
      ) AS score
    FROM semantic_search ss
    FULL OUTER JOIN keyword_search ks ON ss.chunk_id = ks.chunk_id
    ORDER BY score DESC
    LIMIT $6
    `,
    [embeddingSql, query, VECTOR_WEIGHT, RRF_K, KEYWORD_WEIGHT, limit],
  );

  return results;
}

/**
 * Format retrieval results as context string for the LLM.
 */
export function formatContext(results: RetrievalResult[]): string {
  return results
    .map((r, i) => `[Source ${i + 1}] ${r.title} (${r.url})\n${r.content}`)
    .join("\n\n---\n\n");
}
