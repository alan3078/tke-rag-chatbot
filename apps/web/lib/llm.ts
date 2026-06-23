import OpenAI from "openai";

// =============================================================================
// LLM Client — OpenRouter → DeepSeek V4 Pro
// =============================================================================
// Uses a SEPARATE API endpoint from the embedding client.
// OpenRouter: OpenAI-compatible, routes to DeepSeek V4 Pro.
// Pricing: ~$0.43/1M input, ~$0.87/1M output tokens.
// =============================================================================

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",
    "X-Title": "TKE RAG Chatbot",
  },
});

const MODEL = process.env.LLM_MODEL ?? "deepseek/deepseek-v4-pro";

const SYSTEM_PROMPT = `You are a RAG assistant for 清华大学软件学院 / Tsinghua School of Software.

Answer only using the provided context.
If the context does not contain enough information, say you cannot find the answer in the indexed website.
Answer in the same language as the user's question unless the user asks otherwise.
Always include citations using the provided source titles and URLs.
Do not invent names, dates, awards, or article facts.

When citing sources, format them as:
[来源: title](url)`;

import { MessageRole } from "@/lib/constants";
import type { LlmMessage } from "@/types";

export type { LlmMessage };

/**
 * Generate a chat completion with the RAG context.
 */
export async function generateAnswer(
  query: string,
  context: string,
  conversationHistory: LlmMessage[] = [],
): Promise<string> {
  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    {
      role: MessageRole.User,
      content: `Context:\n${context}\n\nQuestion: ${query}`,
    },
  ];

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content ?? "Unable to generate answer.";
}

/**
 * Generate a streaming chat completion.
 * Returns a ReadableStream for SSE responses.
 */
export async function generateAnswerStream(
  query: string,
  context: string,
  conversationHistory: LlmMessage[] = [],
): Promise<ReadableStream<Uint8Array>> {
  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    {
      role: MessageRole.User,
      content: `Context:\n${context}\n\nQuestion: ${query}`,
    },
  ];

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 2000,
    stream: true,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
