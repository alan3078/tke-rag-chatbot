import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import pgvector from "pgvector";
import { EmbeddingsService } from "../embeddings/embeddings.service";
import { SegmentationService } from "../segmentation/segmentation.service";
import { ChunkLevel } from "../common/constants";
import {
  RRF_K,
  VECTOR_TOP_K,
  KEYWORD_TOP_K,
  VECTOR_WEIGHT,
  KEYWORD_WEIGHT,
  FINAL_TOP_K,
} from "./retrieval.constants";

export interface RetrievalResult {
  chunkId: number;
  articleId: number;
  content: string;
  score: number;
  title: string;
  url: string;
  section: string | null;
  publishedDate: Date | string | null;
  level: ChunkLevel;
  imageUrls: string[] | null;
}

interface RankedRow extends RetrievalResult {
  rank: number;
}

@Injectable()
export class RetrievalService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly embeddingsService: EmbeddingsService,
    private readonly segmentationService: SegmentationService,
  ) {}

  /**
   * Hybrid retrieval across ALL chunk levels (L1 + L2).
   *
   * 1. Vector search  — top-K by cosine similarity (all levels)
   * 2. Keyword search — top-K by ts_rank on segmented content (all levels)
   * 3. RRF merge      — weighted reciprocal-rank fusion
   */
  async hybridSearch(query: string, limit: number = FINAL_TOP_K): Promise<RetrievalResult[]> {
    const queryEmbedding = await this.embeddingsService.generateQueryEmbedding(query);
    const embeddingSql = pgvector.toSql(queryEmbedding);

    // Segment the query with jieba so keyword search actually matches
    const segmentedQuery = this.segmentationService.segmentText(query);

    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(embeddingSql),
      this.keywordSearch(segmentedQuery),
    ]);

    const merged = this.mergeWithRrf(vectorResults, keywordResults);
    const deduped = this.deduplicateByArticle(merged);

    return deduped
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  formatContext(results: RetrievalResult[]): string {
    return results
      .map((r, i) => `[Source ${i + 1}] ${r.title} (${r.url})\n${r.content}`)
      .join("\n\n---\n\n");
  }

  /**
   * Vector search across all chunk levels.
   */
  private async vectorSearch(queryEmbeddingSql: string): Promise<RankedRow[]> {
    return this.dataSource.query(
      `
      SELECT
        c.id        AS "chunkId",
        c.article_id AS "articleId",
        c.content   AS content,
        0.0         AS score,
        a.title     AS title,
        a.url       AS url,
        a.section   AS section,
        a.published_date AS "publishedDate",
        c.level     AS level,
        a.image_urls AS "imageUrls",
        RANK() OVER (ORDER BY c.embedding <=> $1::vector) AS rank
      FROM chunks c
      JOIN articles a ON a.id = c.article_id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $1::vector
      LIMIT $2
      `,
      [queryEmbeddingSql, VECTOR_TOP_K],
    );
  }

  /**
   * Full-text keyword search on segmented content, across all chunk levels.
   * The query MUST already be segmented (space-separated) to match the
   * stored content_segmented column.
   */
  private async keywordSearch(segmentedQuery: string): Promise<RankedRow[]> {
    if (!segmentedQuery.trim()) return [];

    return this.dataSource.query(
      `
      SELECT
        c.id        AS "chunkId",
        c.article_id AS "articleId",
        c.content   AS content,
        0.0         AS score,
        a.title     AS title,
        a.url       AS url,
        a.section   AS section,
        a.published_date AS "publishedDate",
        c.level     AS level,
        a.image_urls AS "imageUrls",
        RANK() OVER (
          ORDER BY ts_rank_cd(
            to_tsvector('simple', COALESCE(c.content_segmented, c.content)),
            plainto_tsquery('simple', $1)
          ) DESC
        ) AS rank
      FROM chunks c
      JOIN articles a ON a.id = c.article_id
      WHERE to_tsvector('simple', COALESCE(c.content_segmented, c.content))
            @@ plainto_tsquery('simple', $1)
      ORDER BY ts_rank_cd(
        to_tsvector('simple', COALESCE(c.content_segmented, c.content)),
        plainto_tsquery('simple', $1)
      ) DESC
      LIMIT $2
      `,
      [segmentedQuery, KEYWORD_TOP_K],
    );
  }

  /**
   * Reciprocal Rank Fusion: merge vector and keyword arms.
   * score = VECTOR_WEIGHT / (K + vectorRank) + KEYWORD_WEIGHT / (K + keywordRank)
   */
  private mergeWithRrf(
    vectorResults: RankedRow[],
    keywordResults: RankedRow[],
  ): RetrievalResult[] {
    const merged = new Map<number, RetrievalResult & { vectorRank?: number; keywordRank?: number }>();

    for (const r of vectorResults) {
      merged.set(r.chunkId, {
        ...r,
        vectorRank: r.rank,
        score: VECTOR_WEIGHT * (1 / (RRF_K + r.rank)),
      });
    }

    for (const r of keywordResults) {
      const existing = merged.get(r.chunkId);
      const kwScore = KEYWORD_WEIGHT * (1 / (RRF_K + r.rank));

      if (existing) {
        existing.keywordRank = r.rank;
        existing.score += kwScore;
      } else {
        merged.set(r.chunkId, {
          ...r,
          keywordRank: r.rank,
          score: kwScore,
        });
      }
    }

    return [...merged.values()];
  }

  /**
   * Keep only the highest-scoring chunk per article.
   * Prevents the same article from dominating the results with multiple chunks.
   */
  private deduplicateByArticle(results: RetrievalResult[]): RetrievalResult[] {
    const bestByArticle = new Map<number, RetrievalResult>();

    for (const r of results) {
      const existing = bestByArticle.get(r.articleId);
      if (!existing || r.score > existing.score) {
        bestByArticle.set(r.articleId, r);
      }
    }

    return [...bestByArticle.values()];
  }
}
