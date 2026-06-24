import { Injectable } from "@nestjs/common";
import { ChunkLevel } from "../common/constants";
import {
  L1_TRUNCATION_CHARS,
  L2_MIN_ARTICLE_CHARS,
  L2_TARGET_CHUNK_CHARS,
  L2_MAX_CHUNK_CHARS,
  L2_MIN_CHUNK_CHARS,
  L2_OVERLAP_CHARS,
  SENTENCE_ENDINGS,
} from "./chunking.constants";

export interface ChunkMetadata {
  title: string;
  section: string | null;
  publishedDate: string | null;
}

export interface ChunkData {
  chunkIndex: number;
  level: ChunkLevel;
  content: string;
  tokenCount: number;
}

function buildMetadataPrefix(metadata: ChunkMetadata): string {
  const lines: string[] = [`标题：${metadata.title}`];
  if (metadata.publishedDate) lines.push(`日期：${metadata.publishedDate}`);
  if (metadata.section) lines.push(`栏目：${metadata.section}`);
  lines.push("正文：");
  return lines.join("\n");
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(SENTENCE_ENDINGS)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function mergeSentencesIntoChunks(sentences: string[]): string[] {
  if (sentences.length === 0) return [];

  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const sentence of sentences) {
    if (currentLen + sentence.length > L2_TARGET_CHUNK_CHARS && currentLen >= L2_MIN_CHUNK_CHARS) {
      chunks.push(current.join(""));
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

@Injectable()
export class ChunkingService {
  chunkArticle(body: string, metadata: ChunkMetadata): ChunkData[] {
    const trimmedBody = body.trim();
    if (trimmedBody.length === 0) return [];

    const prefix = buildMetadataPrefix(metadata);
    const chunks: ChunkData[] = [];
    let index = 0;

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

    if (trimmedBody.length >= L2_MIN_ARTICLE_CHARS) {
      const paragraphs = splitParagraphs(trimmedBody);
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
}
