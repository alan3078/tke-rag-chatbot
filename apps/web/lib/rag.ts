// =============================================================================
// RAG Pipeline Orchestrator
// =============================================================================
// Coordinates the full retrieval-augmented generation flow:
//   1. Receive user query
//   2. Retrieve relevant chunks (hybrid search)
//   3. Format context
//   4. Generate answer with LLM
//   5. Extract and return citations
// =============================================================================

import { hybridSearch, formatContext } from "./retrieval";
import { generateAnswer } from "./llm";
import type { RetrievalResult } from "./retrieval";
import type { LlmMessage } from "./llm";

export interface Citation {
  title: string;
  url: string;
  section: string | null;
  date: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  retrievedChunks: RetrievalResult[];
}

/**
 * Run the full RAG pipeline for a user query.
 */
export async function ragQuery(
  query: string,
  conversationHistory: ChatMessage[] = []
): Promise<RagResponse> {
  // 1. Retrieve relevant chunks
  const retrievedChunks = await hybridSearch(query);

  if (retrievedChunks.length === 0) {
    return {
      answer:
        "抱歉，我在已索引的网站内容中找不到与您问题相关的信息。请尝试换个方式提问。",
      citations: [],
      retrievedChunks: [],
    };
  }

  // 2. Format context for LLM
  const context = formatContext(retrievedChunks);

  // 3. Convert chat history to LLM message format
  const llmHistory: LlmMessage[] = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // 4. Generate answer
  const answer = await generateAnswer(query, context, llmHistory);

  // 5. Extract citations from retrieved chunks
  const citations: Citation[] = retrievedChunks
    .map((chunk) => ({
      title: chunk.title,
      url: chunk.url,
      section: chunk.section,
      date: chunk.publishedDate
        ? new Date(chunk.publishedDate).toISOString().split("T")[0]
        : null,
    }))
    // Deduplicate by URL
    .filter(
      (citation, index, self) =>
        self.findIndex((c) => c.url === citation.url) === index
    );

  return {
    answer,
    citations,
    retrievedChunks,
  };
}
