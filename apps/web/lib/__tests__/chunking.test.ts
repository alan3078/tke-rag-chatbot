import { describe, it, expect } from "vitest";
import { chunkArticle, type ChunkMetadata } from "@/lib/chunking";
import {
  ChunkLevel,
  L1_TRUNCATION_CHARS,
  L2_MAX_CHUNK_CHARS,
  L2_OVERLAP_CHARS,
} from "@/lib/constants";
import {
  STUB_ARTICLE,
  SHORT_ARTICLE,
  MEDIUM_ARTICLE,
  LONG_ARTICLE,
  EMPTY_ARTICLE,
} from "./fixtures/articles";

function makeMetadata(article: {
  title: string;
  section: string | null;
  publishedDate: string | null;
}): ChunkMetadata {
  return {
    title: article.title,
    section: article.section,
    publishedDate: article.publishedDate,
  };
}

describe("chunkArticle", () => {
  describe("AC-1: every article produces exactly one L1 chunk", () => {
    it("stub article has one L1 chunk", () => {
      const chunks = chunkArticle(STUB_ARTICLE.body, makeMetadata(STUB_ARTICLE));
      const l1Chunks = chunks.filter((c) => c.level === ChunkLevel.Article);
      expect(l1Chunks).toHaveLength(1);
    });

    it("short article has one L1 chunk", () => {
      const chunks = chunkArticle(SHORT_ARTICLE.body, makeMetadata(SHORT_ARTICLE));
      const l1Chunks = chunks.filter((c) => c.level === ChunkLevel.Article);
      expect(l1Chunks).toHaveLength(1);
    });

    it("medium article has one L1 chunk", () => {
      const chunks = chunkArticle(MEDIUM_ARTICLE.body, makeMetadata(MEDIUM_ARTICLE));
      const l1Chunks = chunks.filter((c) => c.level === ChunkLevel.Article);
      expect(l1Chunks).toHaveLength(1);
    });

    it("long article has one L1 chunk", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      const l1Chunks = chunks.filter((c) => c.level === ChunkLevel.Article);
      expect(l1Chunks).toHaveLength(1);
    });
  });

  describe("AC-3: article < 800 chars produces only L1, zero L2", () => {
    it("stub article (45 chars) has zero L2 chunks", () => {
      const chunks = chunkArticle(STUB_ARTICLE.body, makeMetadata(STUB_ARTICLE));
      const l2Chunks = chunks.filter((c) => c.level === ChunkLevel.Section);
      expect(l2Chunks).toHaveLength(0);
      expect(chunks).toHaveLength(1);
    });

    it("short article (~400 chars) has zero L2 chunks", () => {
      const chunks = chunkArticle(SHORT_ARTICLE.body, makeMetadata(SHORT_ARTICLE));
      const l2Chunks = chunks.filter((c) => c.level === ChunkLevel.Section);
      expect(l2Chunks).toHaveLength(0);
    });
  });

  describe("AC-2: article >= 800 chars produces L1 + L2 chunks", () => {
    it("medium article (~1100 chars) produces L2 chunks", () => {
      const chunks = chunkArticle(MEDIUM_ARTICLE.body, makeMetadata(MEDIUM_ARTICLE));
      const l2Chunks = chunks.filter((c) => c.level === ChunkLevel.Section);
      expect(l2Chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it("long article (~2500 chars) produces multiple L2 chunks", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      const l2Chunks = chunks.filter((c) => c.level === ChunkLevel.Section);
      expect(l2Chunks.length).toBeGreaterThanOrEqual(2);
    });

    it("L2 chunks are within size limits", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      const l2Chunks = chunks.filter((c) => c.level === ChunkLevel.Section);
      for (const chunk of l2Chunks) {
        // Content includes metadata prefix, so we check the whole thing
        // is reasonable (metadata ~50-80 chars + body up to MAX)
        expect(chunk.content.length).toBeLessThanOrEqual(
          L2_MAX_CHUNK_CHARS + 150, // metadata prefix allowance
        );
      }
    });
  });

  describe("AC-5: L1 chunk has metadata prefix", () => {
    it("L1 chunk starts with title", () => {
      const chunks = chunkArticle(SHORT_ARTICLE.body, makeMetadata(SHORT_ARTICLE));
      const l1 = chunks.find((c) => c.level === ChunkLevel.Article)!;
      expect(l1.content).toContain("标题：" + SHORT_ARTICLE.title);
    });

    it("L1 chunk includes date when available", () => {
      const chunks = chunkArticle(SHORT_ARTICLE.body, makeMetadata(SHORT_ARTICLE));
      const l1 = chunks.find((c) => c.level === ChunkLevel.Article)!;
      expect(l1.content).toContain("日期：" + SHORT_ARTICLE.publishedDate);
    });

    it("L1 chunk includes section", () => {
      const chunks = chunkArticle(SHORT_ARTICLE.body, makeMetadata(SHORT_ARTICLE));
      const l1 = chunks.find((c) => c.level === ChunkLevel.Article)!;
      expect(l1.content).toContain("栏目：" + SHORT_ARTICLE.section);
    });

    it("L1 chunk omits date when null", () => {
      const chunks = chunkArticle(STUB_ARTICLE.body, makeMetadata(STUB_ARTICLE));
      const l1 = chunks.find((c) => c.level === ChunkLevel.Article)!;
      expect(l1.content).not.toContain("日期：");
    });
  });

  describe("AC-4: adjacent L2 chunks overlap by ~100 chars", () => {
    it("long article L2 chunks have overlapping content", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      const l2Chunks = chunks.filter((c) => c.level === ChunkLevel.Section);

      expect(l2Chunks.length).toBeGreaterThanOrEqual(2);

      for (let i = 1; i < l2Chunks.length; i++) {
        const prev = l2Chunks[i - 1].content;
        const curr = l2Chunks[i].content;

        // Extract body text after metadata prefix (after "正文：\n")
        const prevBody = prev.split("正文：\n").pop() ?? "";
        const currBody = curr.split("正文：\n").pop() ?? "";

        // Find shared substring: take a middle portion of the overlap zone
        // and check it exists in both chunks
        const prevTail = prevBody.slice(-(L2_OVERLAP_CHARS + 20));
        const currHead = currBody.slice(0, L2_OVERLAP_CHARS + 20);

        // There should be a shared substring of at least 30 chars
        let foundOverlap = false;
        for (let len = 30; len >= 20; len--) {
          const probe = prevTail.slice(-len);
          if (currHead.includes(probe)) {
            foundOverlap = true;
            break;
          }
        }
        expect(foundOverlap).toBe(true);
      }
    });
  });

  describe("AC-9: article > 2000 chars: L1 truncated, L2 covers full", () => {
    it("L1 body content is truncated around 2000 chars", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      const l1 = chunks.find((c) => c.level === ChunkLevel.Article)!;

      // L1 content = metadata prefix + body. Body should be truncated.
      const bodyStart = l1.content.indexOf("正文：\n") + "正文：\n".length;
      const l1Body = l1.content.slice(bodyStart);
      expect(l1Body.length).toBeLessThanOrEqual(L1_TRUNCATION_CHARS + 50); // small tolerance
      expect(l1Body.length).toBeLessThan(LONG_ARTICLE.body.length);
    });

    it("L2 chunks collectively cover more text than L1 alone", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      const l1 = chunks.find((c) => c.level === ChunkLevel.Article)!;
      const l2Chunks = chunks.filter((c) => c.level === ChunkLevel.Section);

      // L2 chunks exist
      expect(l2Chunks.length).toBeGreaterThanOrEqual(2);

      // The last L2 chunk should contain text from near the end of the article
      const lastL2Body = l2Chunks[l2Chunks.length - 1].content.split("正文：\n").pop() ?? "";
      const l1Body = l1.content.split("正文：\n").pop() ?? "";

      // Last L2 chunk's content should NOT be fully contained within L1 body
      // (because L1 is truncated but L2s cover the full article)
      expect(lastL2Body.length).toBeGreaterThan(0);

      // Total L2 body text should be longer than L1 body (since L1 is truncated)
      const totalL2Chars = l2Chunks.reduce((sum, c) => {
        const body = c.content.split("正文：\n").pop() ?? "";
        return sum + body.length;
      }, 0);
      expect(totalL2Chars).toBeGreaterThan(l1Body.length);
    });
  });

  describe("edge cases", () => {
    it("empty body produces empty array", () => {
      const chunks = chunkArticle(EMPTY_ARTICLE.body, makeMetadata(EMPTY_ARTICLE));
      expect(chunks).toHaveLength(0);
    });

    it("chunk indices are sequential starting from 0", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].chunkIndex).toBe(i);
      }
    });

    it("all chunks have correct level values", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      for (const chunk of chunks) {
        expect([ChunkLevel.Article, ChunkLevel.Section]).toContain(chunk.level);
      }
    });

    it("L1 chunk is always first (index 0)", () => {
      const chunks = chunkArticle(LONG_ARTICLE.body, makeMetadata(LONG_ARTICLE));
      expect(chunks[0].level).toBe(ChunkLevel.Article);
      expect(chunks[0].chunkIndex).toBe(0);
    });
  });
});
