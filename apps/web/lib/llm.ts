import OpenAI from "openai";
import { MessageRole } from "@/lib/constants";
import { ensureServerEnv } from "@/lib/server-env";
import type { LlmMessage } from "@/types";

ensureServerEnv();

// =============================================================================
// LLM Client — OpenRouter → DeepSeek V4 Pro
// =============================================================================
// Uses a SEPARATE API endpoint from the embedding client.
// OpenRouter: OpenAI-compatible, routes to DeepSeek V4 Pro.
// Pricing: ~$0.43/1M input, ~$0.87/1M output tokens.
// =============================================================================

const DEFAULT_LLM_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_LLM_MODEL = "deepseek/deepseek-v4-pro";
const DEFAULT_REFERER = "http://localhost:3000";
const APPLICATION_TITLE = "TKE RAG Chatbot";
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 2000;
const MISSING_LLM_API_KEY_ERROR =
  "LLM_API_KEY or OPENAI_API_KEY must be configured for OpenRouter requests.";

const SYSTEM_PROMPT = `You are a RAG assistant for 清华大学软件学院 / Tsinghua School of Software.

Answer only using the provided context.
If the context does not contain enough information, say you cannot find the answer in the indexed website.
Answer in the same language as the user's question unless the user asks otherwise.
Always include citations using the provided source titles and URLs.
Do not invent names, dates, awards, or article facts.

When citing sources, format them as:
[来源: title](url)`;

export type { LlmMessage };

let client: OpenAI | null = null;

function getLlmApiKey(): string {
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(MISSING_LLM_API_KEY_ERROR);
  }

  return apiKey;
}

function getLlmClient(): OpenAI {
  if (client) {
    return client;
  }

  client = new OpenAI({
    apiKey: getLlmApiKey(),
    baseURL: process.env.LLM_BASE_URL ?? DEFAULT_LLM_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_URL ?? DEFAULT_REFERER,
      "X-Title": APPLICATION_TITLE,
    },
  });

  return client;
}

function buildMessages(
  query: string,
  context: string,
  conversationHistory: LlmMessage[],
): LlmMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    {
      role: MessageRole.User,
      content: `Context:\n${context}\n\nQuestion: ${query}`,
    },
  ];
}

/**
 * Generate a chat completion with the RAG context.
 */
export async function generateAnswer(
  query: string,
  context: string,
  conversationHistory: LlmMessage[] = [],
): Promise<string> {
  const messages = buildMessages(query, context, conversationHistory);
  const model = process.env.LLM_MODEL ?? DEFAULT_LLM_MODEL;

  const response = await getLlmClient().chat.completions.create({
    model,
    messages,
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: DEFAULT_MAX_TOKENS,
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
  const messages = buildMessages(query, context, conversationHistory);
  const model = process.env.LLM_MODEL ?? DEFAULT_LLM_MODEL;

  const response = await getLlmClient().chat.completions.create({
    model,
    messages,
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: DEFAULT_MAX_TOKENS,
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
