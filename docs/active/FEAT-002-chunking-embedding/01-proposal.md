# Phase 1: Proposal — Hierarchical Chunking & Embedding Pipeline

> **Status**: PROPOSAL
> **Author**: Agent
> **Date**: 2026-06-24
> **Feature ID**: FEAT-002
> **Related ADR**: [ADR-0006](../../decisions/0006-embedding-model-and-chunking-strategy.md)

---

## 1. Problem Statement

Raw articles must be split into retrieval-friendly chunks and embedded into vectors for semantic search. The site's articles are typically short (500-2000 Chinese characters) with clear structure (title, date, body). A flat chunking approach over-fragments these short articles and loses article-level context needed for accurate citations.

We need a **hierarchical two-level chunking strategy**:
- **Level 1**: One chunk per article (full text with metadata) for broad article-level matching
- **Level 2**: Section-level chunks within longer articles for fine-grained matching

Embeddings use **qwen3-embedding:4b** via local Ollama (1024 dims, 40K context, 100+ languages).

**Current state**: `chunking.ts` (129 lines) and `embeddings.ts` (62 lines) exist but implement the old flat strategy with SiliconFlow BGE-M3. `ingest.ts` has a critical gap: `nodejieba` installed but unused. **All three modules need rewriting.** Zero tests exist.

## 2. Business Requirements

| # | Requirement | Priority | Rationale |
|---|-------------|----------|-----------|
| BR-1 | Generate Level 1 (article-level) chunks: one per article with metadata prefix | Must | Article-level retrieval for citations and broad matching |
| BR-2 | Generate Level 2 (section-level) chunks for articles > 800 chars | Must | Fine-grained matching within long articles |
| BR-3 | Generate 1024-dim embeddings via qwen3-embedding:4b (local Ollama) | Must | Vector similarity search; no external API dependency |
| BR-4 | Segment Chinese text with jieba for keyword search | Must | tsvector requires word-segmented text for Chinese |
| BR-5 | Idempotent: skip articles already chunked/embedded | Should | Re-runnable without data duplication |
| BR-6 | Prepend metadata (title, date, section) to every chunk | Must | Improves retrieval relevance |

## 3. Stakeholder Analysis

| Stakeholder | Role | Concern | How We Address It |
|-------------|------|---------|-------------------|
| End User | Queries the chatbot | Answer quality depends on chunk quality | Hierarchical chunking preserves article context |
| Evaluator | Grades correctness (40%) | Short articles must not be over-fragmented | Articles < 800 chars stay as single L1 chunk |
| Developer | Maintains pipeline | Must understand L1 vs L2 logic, testable modules | Clear separation: chunking, embedding, segmentation |
| Ops / Deploy | Runs ingest script | Must work offline with local Ollama | No external API; `ollama pull qwen3-embedding:4b` |

## 4. User Stories

- **US-1**: As a developer, I want to run `npm run ingest` and have all articles hierarchically chunked, embedded, and stored.
- **US-2**: As a developer, I want every article to have exactly one Level 1 chunk (full text with metadata).
- **US-3**: As a developer, I want articles longer than 800 chars to also have Level 2 chunks (600-900 char sections with overlap).
- **US-4**: As a developer, I want each chunk to have a `content_segmented` field with jieba output for keyword search.
- **US-5**: As a developer, I want embeddings generated via local Ollama (qwen3-embedding:4b), producing 1024-dim vectors.
- **US-6**: As a developer, I want the ingest script to skip already-processed articles on re-run.

## 5. Acceptance Criteria (AC)

| AC ID | User Story | Given | When | Then | Test Type |
|-------|-----------|-------|------|------|-----------|
| AC-1 | US-2 | Any article (short or long) | When `chunkArticle()` is called | Then exactly one Level 1 chunk is produced containing full text with metadata prefix | Unit |
| AC-2 | US-3 | An article with 2000 Chinese characters | When `chunkArticle()` is called | Then it produces 1 L1 chunk + 2-3 L2 chunks (600-900 chars each) | Unit |
| AC-3 | US-3 | An article with < 800 characters | When `chunkArticle()` is called | Then it produces only 1 L1 chunk and zero L2 chunks | Unit |
| AC-4 | US-3 | Two adjacent L2 chunks from the same article | When examined | Then they overlap by approximately 100 characters | Unit |
| AC-5 | US-2 | A Level 1 chunk | When examined | Then it contains metadata prefix (title, date, section) followed by body text | Unit |
| AC-6 | US-4 | Chinese text content | When `segmentText()` is called | Then it returns space-separated jieba-segmented words | Unit |
| AC-7 | US-5 | A chunk content string | When `generateEmbedding()` is called via Ollama | Then it returns an array of exactly 1024 numbers | Unit (mocked Ollama) |
| AC-8 | US-6 | An article with existing chunks in the database | When ingest runs | Then it skips that article | Integration |
| AC-9 | US-3 | An article with > 2000 chars | When Level 1 chunk is created | Then L1 content is truncated to first ~2000 chars; L2 chunks cover the full text | Unit |
| AC-10 | US-5 | Ollama server is not running | When `generateEmbedding()` is called | Then it throws a clear error (not a silent failure) | Unit |

## 6. Blast Radius

### Components Affected

| Component | Impact | Risk Level |
|-----------|--------|------------|
| `apps/web/lib/chunking.ts` | Direct — full rewrite for hierarchical strategy | High |
| `apps/web/lib/embeddings.ts` | Direct — switch from OpenAI client to Ollama | High |
| `scripts/ingest.ts` | Direct — two-level chunk generation | High |
| `apps/web/entities/chunk.entity.ts` | Direct — add `level` column | Med |
| `apps/web/migrations/` | Direct — new migration | Med |
| `apps/web/lib/retrieval.ts` | Indirect — must handle L1 vs L2 chunks | Med |
| `.env.example` | Direct — new Ollama env vars | Low |

### Data Impact

- **Database changes**: New migration adds `level` column to `chunks` table
- **Existing data**: **Full re-ingest required** — old BGE-M3 embeddings incompatible with qwen3-embedding vectors
- **Rollback complexity**: Moderate — delete all chunks, revert migration, re-ingest with old model

## 7. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|-------------|-------------|------------------|
| Flat chunking all articles at 600-900 chars | Over-fragments 500-char articles into useless snippets | Hierarchical: short articles stay as single L1 chunk |
| Only article-level chunks (no L2) | Misses fine-grained matches in 2000+ char articles | L2 chunks for section-level matching in long articles |
| Using remote API for embedding | Slow, rate-limited, blocked from Beijing server | Local Ollama, no API dependency |
| Storing unsegmented text in `content_segmented` | GIN index useless for Chinese without segmentation | Use nodejieba to segment before storing |
| Embedding one-at-a-time | Slow for ~3000+ chunks | Batch embedding via Ollama (limited by memory, not API) |
| Using LangChain text splitters | Challenge requires original implementation | Custom hierarchical chunker |
| Mixing BGE-M3 and qwen3 embeddings | Different vector spaces, incomparable | Full re-ingest with single model |

## 8. Constraints

| Constraint | Source | Implication |
|-----------|--------|-------------|
| qwen3-embedding:4b: 1024 dims chosen | ADR-0006 | HNSW index configured for vector(1024) |
| qwen3-embedding:4b: 40K token context | Model spec | Entire articles fit without truncation for embedding |
| Ollama must be running locally | Infrastructure | `ollama pull qwen3-embedding:4b` before first run |
| nodejieba requires native bindings | Infrastructure | Must work in Docker (Alpine) — already in Dockerfile |
| No LangChain allowed | Challenge rules | Custom implementation required |
| Full re-ingest needed | ADR-0006 | BGE-M3 vectors incompatible; plan for 15-30 min ingest time |

## 9. Security Requirements

| Requirement | Priority | Implementation |
|------------|----------|----------------|
| No API keys needed (local Ollama) | N/A | No secrets for embedding |
| No raw corpus exported to public repo | Must | Database data stays in PostgreSQL, not committed |

### Threat Model

Not applicable — ingest script is a local CLI tool, Ollama runs on localhost.

## 10. Out of Scope

- Image embedding / multi-modal embeddings
- Late chunking (model-internal token-level chunking)
- Reranker model (cross-encoder for post-retrieval scoring)
- Dynamic re-chunking based on query patterns
- Embedding dimension tuning beyond 1024
- Alternative embedding models

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| qwen3-embedding:4b too slow on M1 Pro | Low | Med | 4b model is 2.5 GB, fits in memory; benchmark before committing |
| L1+L2 produces too many chunks (~2x) | Low | Low | More chunks just means slightly larger DB; HNSW handles it |
| nodejieba segmentation quality | Low | Med | Battle-tested library; test with known Chinese sentences |
| Ollama not available in Docker on server | Med | High | Embed locally, pg_dump to server (same as before) |
| 2000-char L1 truncation loses context | Low | Low | L2 chunks cover full text; L1 is for broad matching only |

## 12. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| L1 chunk count | = article count | SQL: `SELECT COUNT(*) FROM chunks WHERE level = 1` |
| L2 chunks only for long articles | 0 L2 chunks for articles < 800 chars | SQL query joining articles and chunks |
| All chunks have embeddings | 100% | `check-coverage.ts` |
| All chunks have jieba-segmented content | 100% | SQL: non-null `content_segmented` |
| Embedding dimensions | Exactly 1024 | Unit test on Ollama output |
| Ingest time (full) | < 30 min for ~850 articles | Timer in ingest script |
| Test coverage | >= 80% on chunking + embedding modules | Jest coverage report |

## 13. Open Questions

- [ ] Should we use jieba's "search mode" or "default mode" for segmentation? — Recommend search mode for better recall
- [ ] What is the exact L1 truncation threshold for very long articles? — Propose 2000 chars (covers 95%+ of articles)
- [ ] Should L2 chunks include the metadata prefix too? — Yes, for consistent retrieval scoring

---

## Sign-off

- [ ] Stakeholder review complete
- [ ] AC agreed upon
- [ ] Ready for Phase 2 (Design)
