import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChunkLevel,
  FINAL_TOP_K,
  KEYWORD_WEIGHT,
  L1_BOOST_FACTOR,
  RRF_K,
  VECTOR_WEIGHT,
} from "@/lib/constants";

const { mockQuery, mockGetDataSource, mockGenerateQueryEmbedding } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockGetDataSource: vi.fn(),
  mockGenerateQueryEmbedding: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getDataSource: mockGetDataSource,
}));

vi.mock("@/lib/embeddings", () => ({
  generateQueryEmbedding: mockGenerateQueryEmbedding,
}));

import { formatContext, hybridSearch } from "@/lib/retrieval";

function makeLevel1Result(
  articleId: number,
  rank: number,
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    chunkId: articleId * 1000,
    articleId,
    content: `L1 chunk ${articleId}`,
    score: 0,
    title: `Article ${articleId}`,
    url: `https://example.com/${articleId}`,
    section: "新闻动态",
    publishedDate: "2026-06-24",
    level: ChunkLevel.Article,
    rank,
    ...overrides,
  };
}

function makeLevel2Result(
  chunkId: number,
  articleId: number,
  rankField: "vectorRank" | "keywordRank",
  rank: number,
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    chunkId,
    articleId,
    content: `L2 chunk ${chunkId}`,
    title: `Article ${articleId}`,
    url: `https://example.com/${articleId}`,
    section: "新闻动态",
    publishedDate: "2026-06-24",
    level: ChunkLevel.Section,
    [rankField]: rank,
    ...overrides,
  };
}

describe("hybridSearch", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockGetDataSource.mockReset();
    mockGenerateQueryEmbedding.mockReset();

    mockGetDataSource.mockResolvedValue({
      query: mockQuery,
    });
    mockGenerateQueryEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
  });

  it("AC-1/2/3: runs separate L1, L2 vector, and L2 keyword searches with level filters", async () => {
    mockQuery
      .mockResolvedValueOnce([makeLevel1Result(11, 1)])
      .mockResolvedValueOnce([makeLevel2Result(101, 11, "vectorRank", 1)])
      .mockResolvedValueOnce([makeLevel2Result(101, 11, "keywordRank", 1)]);

    await hybridSearch("院长是谁？");

    expect(mockQuery).toHaveBeenCalledTimes(3);

    const [l1Sql] = mockQuery.mock.calls[0];
    const [l2VectorSql] = mockQuery.mock.calls[1];
    const [l2KeywordSql] = mockQuery.mock.calls[2];

    expect(l1Sql).toContain("WHERE c.embedding IS NOT NULL");
    expect(l1Sql).toContain("c.level =");
    expect(l2VectorSql).toContain("WHERE c.embedding IS NOT NULL");
    expect(l2VectorSql).toContain("c.level =");
    expect(l2KeywordSql).toContain("to_tsvector('simple'");
    expect(l2KeywordSql).toContain("c.level =");
  });

  it("AC-4/5/6/8: merges L2 results with RRF and applies L1 boost before ranking", async () => {
    mockQuery
      .mockResolvedValueOnce([makeLevel1Result(11, 1), makeLevel1Result(22, 2)])
      .mockResolvedValueOnce([
        makeLevel2Result(101, 11, "vectorRank", 1),
        makeLevel2Result(202, 22, "vectorRank", 2),
      ])
      .mockResolvedValueOnce([
        makeLevel2Result(101, 11, "keywordRank", 3),
        makeLevel2Result(303, 33, "keywordRank", 1),
      ]);

    const results = await hybridSearch("奖学金", 3);

    const boostedScore =
      (VECTOR_WEIGHT * (1 / (RRF_K + 1)) + KEYWORD_WEIGHT * (1 / (RRF_K + 3))) *
      L1_BOOST_FACTOR;
    const boostedVectorOnlyScore = VECTOR_WEIGHT * (1 / (RRF_K + 2)) * L1_BOOST_FACTOR;
    const keywordOnlyScore = KEYWORD_WEIGHT * (1 / (RRF_K + 1));

    expect(results).toHaveLength(3);
    expect(results[0].chunkId).toBe(101);
    expect(results[0].level).toBe(ChunkLevel.Section);
    expect(results[0].score).toBeCloseTo(boostedScore, 8);
    expect(results[1].chunkId).toBe(202);
    expect(results[1].score).toBeCloseTo(boostedVectorOnlyScore, 8);
    expect(results[2].chunkId).toBe(303);
    expect(results[2].score).toBeCloseTo(keywordOnlyScore, 8);
    expect(results.find((result) => result.chunkId === 101)).toBeDefined();
    expect(results.filter((result) => result.chunkId === 101)).toHaveLength(1);
  });

  it("AC-6/9: falls back to top L1 chunks when both L2 searches are empty", async () => {
    mockQuery
      .mockResolvedValueOnce([makeLevel1Result(11, 1), makeLevel1Result(22, 2)])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const results = await hybridSearch("现任领导", 2);

    expect(results).toHaveLength(2);
    expect(results.map((result) => result.level)).toEqual([
      ChunkLevel.Article,
      ChunkLevel.Article,
    ]);
  });

  it("AC-7/10: returns citation-ready fields for English queries against Chinese chunk data", async () => {
    mockQuery
      .mockResolvedValueOnce([makeLevel1Result(11, 1)])
      .mockResolvedValueOnce([
        makeLevel2Result(101, 11, "vectorRank", 1, {
          content: "标题：现任领导\n日期：2026-06-24\n栏目：学院概况\n正文：王建民是院长。",
          title: "现任领导",
          section: "学院概况",
        }),
      ])
      .mockResolvedValueOnce([]);

    const results = await hybridSearch("Who is the dean?", FINAL_TOP_K);

    expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith("Who is the dean?");
    expect(results[0]).toMatchObject({
      title: "现任领导",
      url: "https://example.com/11",
      section: "学院概况",
      level: ChunkLevel.Section,
    });
    expect(formatContext(results)).toContain("[Source 1] 现任领导 (https://example.com/11)");
  });
});
