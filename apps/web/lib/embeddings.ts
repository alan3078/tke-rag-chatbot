import OpenAI from "openai";

// =============================================================================
// Embedding Client — SiliconFlow BGE-M3 (or Ollama local fallback)
// =============================================================================
// Uses a SEPARATE API endpoint from the LLM (chat) client.
// SiliconFlow BGE-M3: free, 1024 dimensions, excellent Chinese support.
// Ollama fallback:    free, local, same 1024 dims via bge-m3 model.
// Both are OpenAI-compatible — just swap EMBEDDING_BASE_URL.
// =============================================================================

const client = new OpenAI({
  apiKey: process.env.EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.EMBEDDING_BASE_URL ?? "https://api.siliconflow.cn/v1",
});

const MODEL = process.env.EMBEDDING_MODEL ?? "BAAI/bge-m3";

// SiliconFlow batch limit is 32 inputs per request
const BATCH_SIZE = parseInt(process.env.EMBEDDING_BATCH_SIZE ?? "32", 10);

/**
 * Generate embeddings for a batch of texts.
 * Automatically splits into sub-batches for API limits.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await client.embeddings.create({
      model: MODEL,
      input: batch,
    });

    const embeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * Generate a single embedding for a query string.
 */
export async function generateQueryEmbedding(
  query: string
): Promise<number[]> {
  const response = await client.embeddings.create({
    model: MODEL,
    input: query,
  });

  return response.data[0].embedding;
}
