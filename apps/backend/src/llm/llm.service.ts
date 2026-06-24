import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { MessageRole } from "../common/constants";
import {
  DEFAULT_LLM_BASE_URL,
  DEFAULT_LLM_MODEL,
  DEFAULT_REFERER,
  APPLICATION_TITLE,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  getSystemPrompt,
} from "./llm.constants";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

@Injectable()
export class LlmService {
  private client: OpenAI | null = null;

  private getLlmApiKey(): string {
    const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("LLM_API_KEY or OPENAI_API_KEY must be configured");
    return apiKey;
  }

  private getClient(): OpenAI {
    if (this.client) return this.client;

    this.client = new OpenAI({
      apiKey: this.getLlmApiKey(),
      baseURL: process.env.LLM_BASE_URL ?? DEFAULT_LLM_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_URL ?? DEFAULT_REFERER,
        "X-Title": APPLICATION_TITLE,
      },
    });

    return this.client;
  }

  async generateAnswer(
    query: string,
    context: string,
    conversationHistory: LlmMessage[] = [],
    locale?: string,
  ): Promise<string> {
    const systemPrompt = getSystemPrompt(locale);

    const messages: LlmMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: MessageRole.User, content: `Context:\n${context}\n\nQuestion: ${query}` },
    ];

    const model = process.env.LLM_MODEL ?? DEFAULT_LLM_MODEL;
    const response = await this.getClient().chat.completions.create({
      model,
      messages,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS,
    });

    return response.choices[0]?.message?.content ?? "Unable to generate answer.";
  }
}
