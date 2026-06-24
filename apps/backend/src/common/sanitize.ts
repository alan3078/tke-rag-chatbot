/**
 * Input sanitization for RAG queries.
 *
 * Defends against:
 * - OWASP LLM01: Prompt injection (system prompt overrides)
 * - OWASP LLM02: Insecure output handling (script injection in stored content)
 * - Excessively long inputs that waste tokens
 */

/** Maximum allowed query length in characters */
const MAX_QUERY_LENGTH = 2000;

/** Patterns commonly used in prompt injection attempts */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?|prompts?)/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /\[\s*INST\s*\]/i,
  /<<\s*SYS\s*>>/i,
  /<\|im_start\|>/i,
  /\[SYSTEM\]/i,
];

export interface SanitizeResult {
  clean: string;
  wasModified: boolean;
}

/**
 * Sanitize user input for safe use in RAG pipeline.
 *
 * - Trims whitespace
 * - Truncates to MAX_QUERY_LENGTH
 * - Strips HTML/script tags
 * - Detects and neutralizes common prompt injection patterns
 */
export function sanitizeQuery(raw: string): SanitizeResult {
  let clean = raw.trim();
  let wasModified = false;

  // Truncate
  if (clean.length > MAX_QUERY_LENGTH) {
    clean = clean.slice(0, MAX_QUERY_LENGTH);
    wasModified = true;
  }

  // Strip HTML tags (prevents XSS if content is ever rendered)
  const stripped = clean.replace(/<[^>]*>/g, "");
  if (stripped !== clean) {
    clean = stripped;
    wasModified = true;
  }

  // Neutralize prompt injection attempts by wrapping in markers
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(clean)) {
      // Don't block the request — just neutralize by removing the injection phrase
      clean = clean.replace(pattern, "[filtered]");
      wasModified = true;
    }
  }

  return { clean, wasModified };
}
