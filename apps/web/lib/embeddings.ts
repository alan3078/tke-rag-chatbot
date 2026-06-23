// =============================================================================
// Embedding Client — Ollama qwen3-embedding:4b (Local)
// =============================================================================
// Generates text embeddings via local Ollama instance.
// Uses the native /api/embed endpoint (not OpenAI-compatible).
//
// Model:      qwen3-embedding:4b (1024 dims, 40K context, 100+ languages)
// Runtime:    Local Ollama (http://localhost:11434)
// See:        ADR-0006 for model selection rationale
// =============================================================================

import {
  OLLAMA_BASE_URL,
  EMBEDDING_MODEL,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_DIMENSIONS,
} from "./constants";

/** Response shape from Ollama /api/embed endpoint */
interface OllamaEmbedResponse {
  model: string;
  embeddings: number[][];
}

/**
 * Call Ollama /api/embed for a batch of texts.
 * Throws on network errors or non-OK responses.
 */
async function callOllamaEmbed(input: string | string[]): Promise<number[][]> {
  const url = `${OLLAMA_BASE_URL}/api/embed`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      input,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ollama embedding failed (${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  const data: OllamaEmbedResponse = await response.json();
  return data.embeddings;
}

/**
 * Generate embeddings for a batch of texts.
 * Automatically splits into sub-batches for memory limits.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const embeddings = await callOllamaEmbed(batch);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * Generate a single embedding for a query string.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const embeddings = await callOllamaEmbed(query);
  return embeddings[0];
}
