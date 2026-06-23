// =============================================================================
// Shared Enums & Constants — Single Source of Truth
// =============================================================================
// All domain enums, sizing constants, and env-parsed tunables live here.
// Every module imports from this file. Never redefine these elsewhere.
// =============================================================================

/** Chunk levels for hierarchical retrieval (ADR-0006) */
export const enum ChunkLevel {
  /** Full article text with metadata — one per article */
  Article = 1,
  /** Section/paragraph group within a long article */
  Section = 2,
}

/** Chat message roles */
export const enum MessageRole {
  User = "user",
  Assistant = "assistant",
}

// =============================================================================
// Chunking Constants
// =============================================================================

/** Max chars for Level 1 chunk body (truncated if longer) */
export const L1_TRUNCATION_CHARS = 2000;

/** Minimum article body length to generate Level 2 chunks */
export const L2_MIN_ARTICLE_CHARS = 800;

/** Target size for each Level 2 chunk */
export const L2_TARGET_CHUNK_CHARS = 750;

/** Maximum size for a Level 2 chunk */
export const L2_MAX_CHUNK_CHARS = 900;

/** Minimum size for a Level 2 chunk (don't create tiny fragments) */
export const L2_MIN_CHUNK_CHARS = 200;

/** Overlap between adjacent Level 2 chunks */
export const L2_OVERLAP_CHARS = 100;

/** Chinese sentence-ending punctuation pattern (split after these) */
export const SENTENCE_ENDINGS = /(?<=[。！？；\n])/;

// =============================================================================
// Embedding Constants
// =============================================================================

/** Ollama model for embedding generation */
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "qwen3-embedding:4b";

/** Embedding vector dimensions */
export const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS ?? "1024", 10);

/** Ollama API base URL */
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

/** Batch size for embedding generation */
export const EMBEDDING_BATCH_SIZE = 32;

// =============================================================================
// Retrieval Constants — Tunable via .env
// =============================================================================

/** RRF vector search arm weight */
export const VECTOR_WEIGHT = parseFloat(process.env.RETRIEVAL_VECTOR_WEIGHT ?? "0.6");

/** RRF keyword search arm weight */
export const KEYWORD_WEIGHT = parseFloat(process.env.RETRIEVAL_KEYWORD_WEIGHT ?? "0.4");

/** Number of final chunks sent to LLM */
export const FINAL_TOP_K = parseInt(process.env.RETRIEVAL_TOP_K ?? "8", 10);

/** Score multiplier for L2 chunks whose parent article matched at L1 */
export const L1_BOOST_FACTOR = parseFloat(process.env.RETRIEVAL_L1_BOOST ?? "1.3");

// =============================================================================
// Retrieval Constants — Structural (not user-configurable)
// =============================================================================

/** Reciprocal Rank Fusion constant (from the RRF paper) */
export const RRF_K = 60;

/** Number of articles from Level 1 vector search */
export const L1_TOP_K = 10;

/** Number of chunks from Level 2 vector search */
export const L2_VECTOR_TOP_K = 20;

/** Number of chunks from Level 2 keyword search */
export const L2_KEYWORD_TOP_K = 20;
