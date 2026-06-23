import { beforeEach, describe, expect, it, vi } from "vitest";
import { MessageRole } from "@/lib/constants";

const chatCreateMock = vi.fn();
const openAiConstructorMock = vi.fn(() => ({
  chat: {
    completions: {
      create: chatCreateMock,
    },
  },
}));

vi.mock("openai", () => ({
  default: openAiConstructorMock,
}));

describe("llm client construction", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.LLM_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_MODEL;
    delete process.env.NEXT_PUBLIC_URL;
  });

  it("does not construct the OpenAI client during module import", async () => {
    await import("@/lib/llm");

    expect(openAiConstructorMock).not.toHaveBeenCalled();
  });
});

describe("generateAnswer", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_BASE_URL = "https://openrouter.test/api/v1";
    process.env.LLM_MODEL = "deepseek/test-model";
    process.env.NEXT_PUBLIC_URL = "http://localhost:3000";
    chatCreateMock.mockResolvedValue({
      choices: [{ message: { content: "answer from llm" } }],
    });
  });

  it("sends the system prompt, history, and context-wrapped question to the LLM", async () => {
    const { generateAnswer } = await import("@/lib/llm");

    const result = await generateAnswer("谁是院长？", "[Source 1] 标题：学院简介", [
      {
        role: MessageRole.Assistant,
        content: "上一轮回答",
      },
    ]);

    expect(result).toBe("answer from llm");
    expect(openAiConstructorMock).toHaveBeenCalledTimes(1);
    expect(chatCreateMock).toHaveBeenCalledTimes(1);

    const request = chatCreateMock.mock.calls[0][0];
    expect(request.model).toBe("deepseek/test-model");
    expect(request.temperature).toBe(0.3);
    expect(request.max_tokens).toBe(2000);
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[0].content).toContain("Answer in the same language as the user's question");
    expect(request.messages[1]).toEqual({
      role: MessageRole.Assistant,
      content: "上一轮回答",
    });
    expect(request.messages[2]).toEqual({
      role: "user",
      content: "Context:\n[Source 1] 标题：学院简介\n\nQuestion: 谁是院长？",
    });
  });
});
