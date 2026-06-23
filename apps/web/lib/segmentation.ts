// =============================================================================
// Chinese Word Segmentation — nodejieba Wrapper
// =============================================================================
// Required for PostgreSQL tsvector keyword search on Chinese content.
// Strategy: split input into Chinese vs non-Chinese segments, apply jieba
// only to Chinese segments, preserve English/numeric tokens intact.
// =============================================================================

import nodejieba from "nodejieba";

/**
 * Splits text into alternating Chinese and non-Chinese segments.
 * Non-Chinese segments (ASCII words, numbers, punctuation) are preserved intact.
 */
function splitChineseAndOther(text: string): string[] {
  // Match either: a run of CJK + CJK punctuation, or a run of non-CJK
  return (
    text.match(
      /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+|[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g,
    ) ?? []
  );
}

/**
 * Check if a string segment is primarily Chinese characters.
 */
function isChinese(segment: string): boolean {
  return /[\u4e00-\u9fff]/.test(segment);
}

/**
 * Segment Chinese text into space-separated words using jieba.
 * English words and numbers are preserved intact (not split per-character).
 * Returns empty string for empty/whitespace-only input.
 */
export function segmentText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return "";

  const segments = splitChineseAndOther(trimmed);
  const result: string[] = [];

  for (const segment of segments) {
    if (isChinese(segment)) {
      // Apply jieba to Chinese text
      const words = nodejieba.cut(segment);
      result.push(...words.filter((w) => w.trim().length > 0));
    } else {
      // Preserve non-Chinese tokens (split on whitespace only)
      const tokens = segment.split(/\s+/).filter((t) => t.length > 0);
      result.push(...tokens);
    }
  }

  return result.join(" ");
}
