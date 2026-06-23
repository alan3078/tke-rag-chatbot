import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const verifySessionMock = vi.fn();
const ragQueryMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  verifySession: verifySessionMock,
}));

vi.mock("@/lib/rag", () => ({
  ragQuery: ragQueryMock,
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    verifySessionMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(makeRequest({ message: "hello" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(ragQueryMock).not.toHaveBeenCalled();
  });

  it("returns 400 when message is missing or invalid", async () => {
    verifySessionMock.mockResolvedValue({ username: "admin" });

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(makeRequest({ history: [] }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Message is required" });
    expect(ragQueryMock).not.toHaveBeenCalled();
  });

  it("returns only answer and citations for a valid request", async () => {
    verifySessionMock.mockResolvedValue({ username: "admin" });
    ragQueryMock.mockResolvedValue({
      answer: "这是答案",
      citations: [
        {
          title: "学院简介",
          url: "https://www.thss.tsinghua.edu.cn/article/101",
          section: "学院概况",
          date: "2026-06-24",
        },
      ],
      retrievedChunks: [{ chunkId: 1 }],
    });

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      makeRequest({
        message: "介绍一下学院",
        history: [{ role: "user", content: "上一轮消息" }],
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "这是答案",
      citations: [
        {
          title: "学院简介",
          url: "https://www.thss.tsinghua.edu.cn/article/101",
          section: "学院概况",
          date: "2026-06-24",
        },
      ],
    });
    expect(ragQueryMock).toHaveBeenCalledWith("介绍一下学院", [
      { role: "user", content: "上一轮消息" },
    ]);
  });
});
