import { Injectable } from "@nestjs/common";
import { RetrievalService, RetrievalResult } from "../retrieval/retrieval.service";
import { LlmService, LlmMessage } from "../llm/llm.service";
import { SessionService } from "./session.service";
import { normalizePublishedDate } from "../common/date-utils";
import { sanitizeQuery } from "../common/sanitize";
import { Citation, ChatResponse } from "./dto/chat-request.dto";

@Injectable()
export class ChatService {
  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly llmService: LlmService,
    private readonly sessionService: SessionService,
  ) {}

  async ragQuery(
    userId: number,
    query: string,
    sessionId?: string,
    locale?: string,
  ): Promise<ChatResponse & { sessionId: string }> {
    // Sanitize user input (prompt injection defense)
    const { clean: sanitizedQuery } = sanitizeQuery(query);

    // Create or reuse session
    let activeSessionId: string;
    if (sessionId) {
      activeSessionId = sessionId;
    } else {
      const session = await this.sessionService.createSession(userId);
      activeSessionId = session.id;
    }

    // Save user message (store sanitized version)
    await this.sessionService.saveMessage(activeSessionId, "user", sanitizedQuery);

    // Auto-title on first message
    if (!sessionId) {
      await this.sessionService.autoTitle(activeSessionId, sanitizedQuery);
    }

    // Load conversation history from DB
    const dbHistory = await this.sessionService.getSessionHistory(activeSessionId);
    // Exclude the just-saved user message (last entry) — it will be the query
    const conversationHistory = dbHistory.slice(0, -1);

    // Retrieve relevant chunks
    const retrievedChunks = await this.retrievalService.hybridSearch(sanitizedQuery);

    if (retrievedChunks.length === 0) {
      const noResultAnswer = locale === "en"
        ? "Sorry, I could not find relevant information in the indexed website content. Please try rephrasing your question."
        : "抱歉，我在已索引的网站内容中找不到与您问题相关的信息。请尝试换个问法。";

      await this.sessionService.saveMessage(activeSessionId, "assistant", noResultAnswer, []);

      return {
        answer: noResultAnswer,
        citations: [],
        sessionId: activeSessionId,
      };
    }

    const context = this.retrievalService.formatContext(retrievedChunks);
    const history: LlmMessage[] = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const answer = await this.llmService.generateAnswer(sanitizedQuery, context, history, locale);
    const citations = this.buildCitations(retrievedChunks, answer);

    // Save assistant message with citations
    await this.sessionService.saveMessage(activeSessionId, "assistant", answer, citations);

    return { answer, citations, sessionId: activeSessionId };
  }

  /**
   * Build citations from retrieval results, filtered to only include
   * sources the LLM actually referenced in its answer.
   */
  private buildCitations(results: RetrievalResult[], answer: string): Citation[] {
    const seenKeys = new Set<string>();
    const citations: Citation[] = [];

    for (const result of results) {
      // Deduplicate by both URL and title (cross-posted articles share titles)
      if (seenKeys.has(result.url) || seenKeys.has(result.title)) continue;
      seenKeys.add(result.url);
      seenKeys.add(result.title);

      // Only include citations the LLM actually referenced (by URL or title)
      const referenced = answer.includes(result.url) || answer.includes(result.title);
      if (!referenced) continue;

      citations.push({
        title: result.title,
        url: result.url,
        section: result.section,
        date: normalizePublishedDate(result.publishedDate),
        imageUrl: result.imageUrls?.[0] ?? null,
      });
    }

    // Fallback: if the LLM didn't cite anything inline, return the top result
    if (citations.length === 0 && results.length > 0) {
      const top = results[0];
      citations.push({
        title: top.title,
        url: top.url,
        section: top.section,
        date: normalizePublishedDate(top.publishedDate),
        imageUrl: top.imageUrls?.[0] ?? null,
      });
    }

    return citations;
  }
}
