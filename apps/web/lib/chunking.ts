// =============================================================================
// Hierarchical Chinese-Aware Text Chunking (ADR-0006)
// =============================================================================
// Two-level chunking strategy tailored to site article characteristics:
//
//   Level 1 (Article): One chunk per article — full text with metadata prefix.
//                      Truncated at L1_TRUNCATION_CHARS for very long articles.
//
//   Level 2 (Section): Multiple chunks per long article (body >= L2_MIN_ARTICLE_CHARS).
//                      Split on paragraph boundaries, then sentence boundaries.
//                      Target ~L2_TARGET_CHUNK_CHARS with ~L2_OVERLAP_CHARS overlap.
//
// All chunks get a metadata prefix: title, date (if any), section (if any).
// =============================================================================

import {
  ChunkLevel,
  L1_TRUNCATION_CHARS,
  L2_MIN_ARTICLE_CHARS,
  L2_TARGET_CHUNK_CHARS,
  L2_MAX_CHUNK_CHARS,
  L2_MIN_CHUNK_CHARS,
  L2_OVERLAP_CHARS,
  SENTENCE_ENDINGS,
} from "./constants";
import type { ChunkMetadata, ChunkData } from "@/types";

export type { ChunkMetadata, ChunkData };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build the metadata prefix prepended to every chunk. */
function buildMetadataPrefix(metadata: ChunkMetadata): string {
  const lines: string[] = [`标题：${metadata.title}`];
  if (metadata.publishedDate) lines.push(`日期：${metadata.publishedDate}`);
  if (metadata.section) lines.push(`栏目：${metadata.section}`);
  lines.push("正文：");
  return lines.join("\n");
}

/** Split text into paragraphs on double newlines. */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Split a paragraph into sentences on Chinese punctuation. */
function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(SENTENCE_ENDINGS)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Merge sentences into chunks respecting size constraints with overlap.
 * Returns raw text chunks (no metadata prefix).
 */
function mergeSentencesIntoChunks(sentences: string[]): string[] {
  if (sentences.length === 0) return [];

  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const sentence of sentences) {
    if (currentLen + sentence.length > L2_TARGET_CHUNK_CHARS && currentLen >= L2_MIN_CHUNK_CHARS) {
      chunks.push(current.join(""));

      // Keep overlap from the end of current chunk
      const overlapText = current.join("").slice(-L2_OVERLAP_CHARS);
      current = [overlapText];
      currentLen = overlapText.length;
    }
    current.push(sentence);
    currentLen += sentence.length;
  }

  if (current.length > 0 && currentLen > 0) {
    chunks.push(current.join(""));
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Chunk an article body into hierarchical L1 + L2 chunks.
 *
 * Rules:
 * - Always produces exactly 1 L1 chunk (full text, truncated at 2000 chars if needed)
 * - Produces L2 chunks only if body >= 800 chars
 * - L2 chunks are 600-900 chars with ~100 char overlap
 * - All chunks get metadata prefix (title, date, section)
 * - Returns empty array for empty body
 */
export function chunkArticle(body: string, metadata: ChunkMetadata): ChunkData[] {
  const trimmedBody = body.trim();
  if (trimmedBody.length === 0) return [];

  const prefix = buildMetadataPrefix(metadata);
  const chunks: ChunkData[] = [];
  let index = 0;

  // --- Level 1: Article-level chunk (always exactly one) ---
  const l1Body =
    trimmedBody.length > L1_TRUNCATION_CHARS
      ? trimmedBody.slice(0, L1_TRUNCATION_CHARS)
      : trimmedBody;

  chunks.push({
    chunkIndex: index++,
    level: ChunkLevel.Article,
    content: `${prefix}\n${l1Body}`,
    tokenCount: l1Body.length,
  });

  // --- Level 2: Section-level chunks (only for long articles) ---
  if (trimmedBody.length >= L2_MIN_ARTICLE_CHARS) {
    const paragraphs = splitParagraphs(trimmedBody);

    // Collect all sentences from all paragraphs
    const allSentences: string[] = [];
    for (const paragraph of paragraphs) {
      if (paragraph.length <= L2_MAX_CHUNK_CHARS) {
        allSentences.push(paragraph + "\n");
      } else {
        const sentences = splitSentences(paragraph);
        allSentences.push(...sentences);
      }
    }

    const rawChunks = mergeSentencesIntoChunks(allSentences);

    for (const rawChunk of rawChunks) {
      chunks.push({
        chunkIndex: index++,
        level: ChunkLevel.Section,
        content: `${prefix}\n${rawChunk.trim()}`,
        tokenCount: rawChunk.trim().length,
      });
    }
  }

  return chunks;
}
