import { Injectable } from "@nestjs/common";
import {
  OLLAMA_BASE_URL,
  EMBEDDING_MODEL,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_DIMENSIONS,
} from "./embeddings.constants";

interface OllamaEmbedResponse {
  model: string;
  embeddings: number[][];
}

async function callOllamaEmbed(input: string | string[]): Promise<number[][]> {
  const url = `${OLLAMA_BASE_URL}/api/embed`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMENSIONS, input }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ollama embedding failed (${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  const data = (await response.json()) as OllamaEmbedResponse;
  return data.embeddings;
}

@Injectable()
export class EmbeddingsService {
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
      const embeddings = await callOllamaEmbed(batch);
      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  }

  async generateQueryEmbedding(query: string): Promise<number[]> {
    const embeddings = await callOllamaEmbed(query);
    return embeddings[0];
  }
}
