import { describe, it, expect, vi, beforeEach } from "vitest";
import { EMBEDDING_DIMENSIONS } from "@/lib/constants";

// Mock global fetch for Ollama HTTP calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocking
import { generateEmbeddings, generateQueryEmbedding } from "@/lib/embeddings";

function makeFakeEmbedding(dims: number = EMBEDDING_DIMENSIONS): number[] {
  return Array.from({ length: dims }, (_, i) => i * 0.001);
}

function mockOllamaSuccess(count: number, dims: number = EMBEDDING_DIMENSIONS) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      model: "qwen3-embedding:4b",
      embeddings: Array.from({ length: count }, () => makeFakeEmbedding(dims)),
    }),
  });
}

function mockOllamaError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: message,
    text: async () => message,
  });
}

function mockOllamaNetworkError() {
  mockFetch.mockRejectedValueOnce(new Error("connect ECONNREFUSED 127.0.0.1:11434"));
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("generateQueryEmbedding", () => {
  it("AC-7: returns array of exactly EMBEDDING_DIMENSIONS numbers", async () => {
    mockOllamaSuccess(1);

    const result = await generateQueryEmbedding("test query");

    expect(result).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(typeof result[0]).toBe("number");
  });

  it("calls Ollama /api/embed with correct payload", async () => {
    mockOllamaSuccess(1);

    await generateQueryEmbedding("清华大学软件学院");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/embed");

    const body = JSON.parse(options.body);
    expect(body.model).toBe("qwen3-embedding:4b");
    expect(body.dimensions).toBe(EMBEDDING_DIMENSIONS);
    expect(body.input).toBe("清华大学软件学院");
  });

  it("AC-10: throws typed error when Ollama is unreachable", async () => {
    mockOllamaNetworkError();

    await expect(generateQueryEmbedding("test")).rejects.toThrow();
  });

  it("AC-10: throws on HTTP error response", async () => {
    mockOllamaError(500, "Internal Server Error");

    await expect(generateQueryEmbedding("test")).rejects.toThrow();
  });
});

describe("generateEmbeddings", () => {
  it("returns embeddings for multiple texts", async () => {
    mockOllamaSuccess(3);

    const result = await generateEmbeddings(["text1", "text2", "text3"]);

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it("returns empty array for empty input", async () => {
    const result = await generateEmbeddings([]);
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("batches large inputs", async () => {
    // 50 texts with batch size 32 = 2 API calls
    const texts = Array.from({ length: 50 }, (_, i) => `text ${i}`);

    mockOllamaSuccess(32); // first batch
    mockOllamaSuccess(18); // second batch

    const result = await generateEmbeddings(texts);

    expect(result).toHaveLength(50);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("propagates Ollama errors", async () => {
    mockOllamaError(503, "Service Unavailable");

    await expect(generateEmbeddings(["test"])).rejects.toThrow();
  });
});
