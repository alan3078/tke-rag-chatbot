// =============================================================================
// Centralized Type Definitions — Single Source of Truth
// =============================================================================
// All shared domain types live here. Every module imports from this file.
// Module-internal types (e.g., OllamaEmbedResponse, component Props) stay local.
// =============================================================================

import { type ChunkLevel, MessageRole } from "@/lib/constants";

// =============================================================================
// Chat & Message Types
// =============================================================================

/** Base message shape shared by chat UI and LLM client */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** Extended message for LLM API calls (adds system role) */
export interface LlmMessage {
  role: "system" | MessageRole;
  content: string;
}

/** Chat message with optional citations (used in UI display) */
export interface DisplayMessage extends ChatMessage {
  citations?: Citation[];
}

// =============================================================================
// Citation & RAG Response Types
// =============================================================================

/** Source citation returned with RAG answers */
export interface Citation {
  title: string;
  url: string;
  section: string | null;
  date: string | null;
}

/** Full response from the RAG pipeline */
export interface RagResponse {
  answer: string;
  citations: Citation[];
  retrievedChunks: RetrievalResult[];
}

// =============================================================================
// Retrieval Types
// =============================================================================

/** A single chunk result from hybrid retrieval */
export interface RetrievalResult {
  chunkId: number;
  articleId: number;
  content: string;
  score: number;
  title: string;
  url: string;
  section: string | null;
  publishedDate: Date | null;
}

// =============================================================================
// Chunking Types
// =============================================================================

/** Metadata prepended to each chunk */
export interface ChunkMetadata {
  title: string;
  section: string | null;
  publishedDate: string | null;
}

/** A single chunk output from the chunking pipeline */
export interface ChunkData {
  chunkIndex: number;
  level: ChunkLevel;
  content: string;
  tokenCount: number;
}
