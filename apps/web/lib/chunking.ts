// =============================================================================
// Chinese-Aware Text Chunking
// =============================================================================
// Strategy:
//   1. Split on paragraph boundaries (\n\n)
//   2. Within paragraphs, split on sentence boundaries (。！？)
//   3. Merge small segments up to target size (600-900 chars)
//   4. Add overlap between chunks (100-150 chars)
//   5. Prepend metadata (title, date, section) to each chunk
// =============================================================================

const TARGET_CHUNK_SIZE = 750; // Chinese characters
const MAX_CHUNK_SIZE = 900;
const MIN_CHUNK_SIZE = 200;
const OVERLAP_SIZE = 120;

/** Chinese sentence-ending punctuation */
const SENTENCE_ENDINGS = /(?<=[。！？；\n])/;

/** Split text into paragraphs */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Split a paragraph into sentences */
function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(SENTENCE_ENDINGS)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Merge sentences into chunks respecting size constraints.
 */
function mergeSentencesIntoChunks(sentences: string[]): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const sentence of sentences) {
    if (
      currentLen + sentence.length > TARGET_CHUNK_SIZE &&
      currentLen >= MIN_CHUNK_SIZE
    ) {
      chunks.push(current.join(""));

      // Keep overlap from the end of current chunk
      const overlapText = current.join("").slice(-OVERLAP_SIZE);
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

export interface ChunkMetadata {
  title: string;
  section: string | null;
  publishedDate: string | null;
}

/**
 * Chunk article body text into appropriately-sized pieces.
 */
export function chunkArticle(body: string, metadata: ChunkMetadata): string[] {
  const paragraphs = splitParagraphs(body);

  // Collect all sentences from all paragraphs
  const allSentences: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= MAX_CHUNK_SIZE) {
      allSentences.push(paragraph + "\n");
    } else {
      const sentences = splitSentences(paragraph);
      allSentences.push(...sentences);
    }
  }

  // Merge into chunks
  const rawChunks = mergeSentencesIntoChunks(allSentences);

  // Prepend metadata to each chunk
  const metadataPrefix = [
    `标题：${metadata.title}`,
    metadata.publishedDate ? `日期：${metadata.publishedDate}` : null,
    metadata.section ? `栏目：${metadata.section}` : null,
    "正文：",
  ]
    .filter(Boolean)
    .join("\n");

  return rawChunks.map((chunk) => `${metadataPrefix}\n${chunk.trim()}`);
}

export interface ChunkData {
  articleId: number;
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

/**
 * Create chunk data objects from article text.
 */
export function createChunks(
  articleId: number,
  body: string,
  metadata: ChunkMetadata
): ChunkData[] {
  const chunkTexts = chunkArticle(body, metadata);

  return chunkTexts.map((content, index) => ({
    articleId,
    chunkIndex: index,
    content,
    tokenCount: content.length,
  }));
}
