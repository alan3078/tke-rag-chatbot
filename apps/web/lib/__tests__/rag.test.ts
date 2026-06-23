import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChunkLevel, MessageRole } from "@/lib/constants";
import type { RetrievalResult } from "@/types";

const hybridSearchMock = vi.fn();
const formatContextMock = vi.fn();
const generateAnswerMock = vi.fn();

vi.mock("@/lib/retrieval", () => ({
  hybridSearch: hybridSearchMock,
  formatContext: formatContextMock,
}));

vi.mock("@/lib/llm", () => ({
  generateAnswer: generateAnswerMock,
}));

function makeChunk(overrides: Partial<RetrievalResult> = {}): RetrievalResult {
  return {
    chunkId: 1,
    articleId: 101,
    content: "学院成立于2001年。",
    score: 0.91,
    title: "学院简介",
    url: "https://www.thss.tsinghua.edu.cn/article/101",
    section: "学院概况",
    publishedDate: "2026-06-24T00:00:00.000Z",
    level: ChunkLevel.Article,
    ...overrides,
  };
}

describe("ragQuery", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns a refusal answer and skips the LLM when retrieval is empty", async () => {
    hybridSearchMock.mockResolvedValue([]);

    const { ragQuery } = await import("@/lib/rag");
    const result = await ragQuery("院长是谁？");

    expect(result.answer).toContain("找不到");
    expect(result.citations).toEqual([]);
    expect(result.retrievedChunks).toEqual([]);
    expect(formatContextMock).not.toHaveBeenCalled();
    expect(generateAnswerMock).not.toHaveBeenCalled();
  });

  it("formats retrieved context, calls the LLM, and deduplicates citations by URL", async () => {
    const chunks = [
      makeChunk(),
      makeChunk({
        chunkId: 2,
        content: "学院位于清华大学。",
      }),
      makeChunk({
        chunkId: 3,
        articleId: 102,
        title: "现任领导",
        url: "https://www.thss.tsinghua.edu.cn/article/102",
        section: "领导团队",
      }),
    ];

    hybridSearchMock.mockResolvedValue(chunks);
    formatContextMock.mockReturnValue("[Source 1] ...\n[Source 2] ...");
    generateAnswerMock.mockResolvedValue("生成的答案");

    const { ragQuery } = await import("@/lib/rag");
    const result = await ragQuery("介绍一下学院", [
      { role: MessageRole.User, content: "前情提问" },
    ]);

    expect(formatContextMock).toHaveBeenCalledWith(chunks);
    expect(generateAnswerMock).toHaveBeenCalledWith(
      "介绍一下学院",
      "[Source 1] ...\n[Source 2] ...",
      [{ role: MessageRole.User, content: "前情提问" }],
    );
    expect(result.answer).toBe("生成的答案");
    expect(result.citations).toEqual([
      {
        title: "学院简介",
        url: "https://www.thss.tsinghua.edu.cn/article/101",
        section: "学院概况",
        date: "2026-06-24",
      },
      {
        title: "现任领导",
        url: "https://www.thss.tsinghua.edu.cn/article/102",
        section: "领导团队",
        date: "2026-06-24",
      },
    ]);
  });

  it("returns null citation dates instead of throwing when a retrieved chunk has an invalid publishedDate", async () => {
    hybridSearchMock.mockResolvedValue([
      makeChunk({
        publishedDate: "not-a-real-date",
      }),
    ]);
    formatContextMock.mockReturnValue("[Source 1] ...");
    generateAnswerMock.mockResolvedValue("生成的答案");

    const { ragQuery } = await import("@/lib/rag");
    const result = await ragQuery("学院什么时候成立？");

    expect(result.citations).toEqual([
      {
        title: "学院简介",
        url: "https://www.thss.tsinghua.edu.cn/article/101",
        section: "学院概况",
        date: null,
      },
    ]);
  });
});
