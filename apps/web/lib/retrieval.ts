// =============================================================================
// Hybrid Retrieval: Vector Search + Keyword Search with RRF
// =============================================================================
// Uses a two-level retrieval strategy:
//   - L1 article-level vector search for broad relevance
//   - L2 vector + keyword search for fine-grained chunk matching
//   - Reciprocal Rank Fusion plus L1 score boosting
// =============================================================================

import pgvector from "pgvector";
import { getDataSource } from "./db";
import { generateQueryEmbedding } from "./embeddings";
import {
  ChunkLevel,
  FINAL_TOP_K,
  KEYWORD_WEIGHT,
  L1_BOOST_FACTOR,
  L1_TOP_K,
  L2_KEYWORD_TOP_K,
  L2_VECTOR_TOP_K,
  RRF_K,
  VECTOR_WEIGHT,
} from "./constants";
import type { RetrievalResult } from "@/types";

export type { RetrievalResult };

interface Level1SearchRow extends RetrievalResult {
  rank: number;
}

interface Level2SearchRow extends RetrievalResult {
  vectorRank?: number;
  keywordRank?: number;
}

async function searchLevel1(queryEmbeddingSql: string): Promise<Level1SearchRow[]> {
  const ds = await getDataSource();
  return ds.query(
    `
    SELECT
      c.id AS "chunkId",
      c.article_id AS "articleId",
      c.content AS content,
      0.0 AS score,
      a.title AS title,
      a.url AS url,
      a.section AS section,
      a.published_date AS "publishedDate",
      c.level AS level,
      RANK() OVER (ORDER BY c.embedding <=> $1::vector) AS rank
    FROM chunks c
    JOIN articles a ON a.id = c.article_id
    WHERE c.embedding IS NOT NULL
      AND c.level = $2
    ORDER BY c.embedding <=> $1::vector
    LIMIT $3
    `,
    [queryEmbeddingSql, ChunkLevel.Article, L1_TOP_K],
  );
}

async function searchLevel2Vector(queryEmbeddingSql: string): Promise<Level2SearchRow[]> {
  const ds = await getDataSource();
  return ds.query(
    `
    SELECT
      c.id AS "chunkId",
      c.article_id AS "articleId",
      c.content AS content,
      0.0 AS score,
      a.title AS title,
      a.url AS url,
      a.section AS section,
      a.published_date AS "publishedDate",
      c.level AS level,
      RANK() OVER (ORDER BY c.embedding <=> $1::vector) AS "vectorRank"
    FROM chunks c
    JOIN articles a ON a.id = c.article_id
    WHERE c.embedding IS NOT NULL
      AND c.level = $2
    ORDER BY c.embedding <=> $1::vector
    LIMIT $3
    `,
    [queryEmbeddingSql, ChunkLevel.Section, L2_VECTOR_TOP_K],
  );
}

async function searchLevel2Keyword(query: string): Promise<Level2SearchRow[]> {
  const ds = await getDataSource();
  return ds.query(
    `
    SELECT
      c.id AS "chunkId",
      c.article_id AS "articleId",
      c.content AS content,
      0.0 AS score,
      a.title AS title,
      a.url AS url,
      a.section AS section,
      a.published_date AS "publishedDate",
      c.level AS level,
      RANK() OVER (
        ORDER BY ts_rank_cd(
          to_tsvector('simple', COALESCE(c.content_segmented, c.content)),
          plainto_tsquery('simple', $1)
        ) DESC
      ) AS "keywordRank"
    FROM chunks c
    JOIN articles a ON a.id = c.article_id
    WHERE c.level = $2
      AND to_tsvector('simple', COALESCE(c.content_segmented, c.content))
          @@ plainto_tsquery('simple', $1)
    ORDER BY ts_rank_cd(
      to_tsvector('simple', COALESCE(c.content_segmented, c.content)),
      plainto_tsquery('simple', $1)
    ) DESC
    LIMIT $3
    `,
    [query, ChunkLevel.Section, L2_KEYWORD_TOP_K],
  );
}

function mergeLevel2ResultsWithRrf(
  vectorResults: Level2SearchRow[],
  keywordResults: Level2SearchRow[],
): RetrievalResult[] {
  const merged = new Map<number, Level2SearchRow>();

  for (const result of vectorResults) {
    merged.set(result.chunkId, {
      ...result,
      score: VECTOR_WEIGHT * (1 / (RRF_K + (result.vectorRank ?? 0))),
    });
  }

  for (const result of keywordResults) {
    const existing = merged.get(result.chunkId);
    const keywordScore = KEYWORD_WEIGHT * (1 / (RRF_K + (result.keywordRank ?? 0)));

    if (existing) {
      merged.set(result.chunkId, {
        ...existing,
        keywordRank: result.keywordRank,
        score: existing.score + keywordScore,
      });
      continue;
    }

    merged.set(result.chunkId, {
      ...result,
      score: keywordScore,
    });
  }

  return [...merged.values()];
}

function applyLevel1Boost(
  results: RetrievalResult[],
  level1Results: Level1SearchRow[],
): RetrievalResult[] {
  const boostedArticleIds = new Set(level1Results.map((result) => result.articleId));

  return results.map((result) => ({
    ...result,
    score: boostedArticleIds.has(result.articleId) ? result.score * L1_BOOST_FACTOR : result.score,
  }));
}

function fallbackToLevel1Results(
  level2Results: RetrievalResult[],
  level1Results: Level1SearchRow[],
): RetrievalResult[] {
  if (level2Results.length > 0) {
    return level2Results;
  }

  return level1Results.map((result) => ({
    ...result,
    score: VECTOR_WEIGHT * (1 / (RRF_K + result.rank)),
  }));
}

/**
 * Perform hybrid retrieval: vector + keyword search with RRF fusion.
 */
export async function hybridSearch(
  query: string,
  limit: number = FINAL_TOP_K,
): Promise<RetrievalResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);
  const embeddingSql = pgvector.toSql(queryEmbedding);

  // 2. Run all retrieval arms
  const [level1Results, level2VectorResults, level2KeywordResults] = await Promise.all([
    searchLevel1(embeddingSql),
    searchLevel2Vector(embeddingSql),
    searchLevel2Keyword(query),
  ]);

  // 3. Merge, boost, and fall back if no L2 results were found
  const mergedLevel2Results = mergeLevel2ResultsWithRrf(level2VectorResults, level2KeywordResults);
  const boostedLevel2Results = applyLevel1Boost(mergedLevel2Results, level1Results);
  const finalCandidates = fallbackToLevel1Results(boostedLevel2Results, level1Results);

  return finalCandidates
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((result) => ({
      ...result,
      level: result.level ?? ChunkLevel.Article,
    }));
}

/**
 * Format retrieval results as context string for the LLM.
 */
export function formatContext(results: RetrievalResult[]): string {
  return results
    .map((r, i) => `[Source ${i + 1}] ${r.title} (${r.url})\n${r.content}`)
    .join("\n\n---\n\n");
}
