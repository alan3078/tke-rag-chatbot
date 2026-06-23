# Phase 1: Proposal — Two-Level Hybrid Retrieval (Vector + Keyword + RRF)

> **Status**: PROPOSAL
> **Author**: Agent
> **Date**: 2026-06-24
> **Feature ID**: FEAT-003
> **Related ADR**: [ADR-0006](../../decisions/0006-embedding-model-and-chunking-strategy.md)

---

## 1. Problem Statement

The retrieval layer must find the most relevant content for a user query from ~850 articles. With hierarchical chunking (ADR-0006), we now have two chunk levels:
- **Level 1** (article-level): broad semantic matching, one per article
- **Level 2** (section-level): fine-grained matching within long articles

The retrieval must search both levels, combine vector similarity + keyword matching via RRF, and boost Level 2 chunks whose parent article scored well at Level 1. This gives the best of both worlds: article-level relevance for citations + section-level precision for context.

**Current state**: `retrieval.ts` (119 lines) implements flat single-level hybrid search. It needs rewriting for two-level logic. Zero tests exist.

**Bilingual note**: The corpus is entirely Chinese. "Bilingual support" means users can query in English or Chinese. qwen3-embedding:4b (100+ languages) maps English queries close to semantically similar Chinese content in vector space. Keyword search has lower recall for English queries (Chinese tsvector won't match English terms), but vector search compensates via RRF.

## 2. Business Requirements

| # | Requirement | Priority | Rationale |
|---|-------------|----------|-----------|
| BR-1 | Level 1 vector search: find top matching articles by semantic similarity | Must | Identifies relevant articles broadly |
| BR-2 | Level 2 vector search: find top matching sections within articles | Must | Fine-grained context for LLM |
| BR-3 | Level 2 keyword search: tsvector matching on segmented text | Must | Catches exact name/date/term matches that vectors miss |
| BR-4 | RRF merge of L2 vector + L2 keyword results | Must | Better than either method alone |
| BR-5 | Boost L2 scores when parent article matched at L1 | Must | Article-level relevance reinforces section-level precision |
| BR-6 | Return top 5-8 chunks with article metadata for citations | Must | LLM needs context; UI needs citation data |
| BR-7 | Handle bilingual queries (Chinese + English) | Must | qwen3-embedding:4b supports cross-lingual matching |

## 3. Stakeholder Analysis

| Stakeholder | Role | Concern | How We Address It |
|-------------|------|---------|-------------------|
| End User | Asks questions | Wants relevant, accurate answers | Two-level search with boosting maximizes relevance |
| Evaluator | Grades correctness (40%) | Retrieval quality directly determines answer correctness | RRF + L1 boosting ensures best chunks surface |
| Developer | Maintains retrieval code | Must understand two-level logic and scoring | Clear separation: L1 search, L2 search, merge, boost |
| Ops / Deploy | Runs in production | Query latency must be acceptable | HNSW index for fast vector search, GIN for keyword |

## 4. User Stories

- **US-1**: As a user, I want my question to find relevant articles (Level 1), so that the system identifies the right source.
- **US-2**: As a user, I want fine-grained section matches (Level 2), so that the answer references the most specific passage.
- **US-3**: As a user, I want keyword matches for specific names, dates, and terms, so that exact matches are not missed.
- **US-4**: As a user, I want the best results combined from all approaches, so that I get the most relevant answer.
- **US-5**: As a developer, I want retrieval results to include article title, URL, section, date, and chunk level, so that citations can be generated.
- **US-6**: As a user, I want to ask questions in English and still get relevant results from the Chinese corpus.

## 5. Acceptance Criteria (AC)

| AC ID | User Story | Given | When | Then | Test Type |
|-------|-----------|-------|------|------|-----------|
| AC-1 | US-1 | A query embedding and Level 1 chunks in the database | When `searchLevel1()` runs | Then it returns top 10 articles ordered by cosine similarity | Unit (mocked DB) |
| AC-2 | US-2 | A query embedding and Level 2 chunks in the database | When `searchLevel2Vector()` runs | Then it returns top 20 L2 chunks ordered by cosine similarity | Unit (mocked DB) |
| AC-3 | US-3 | A keyword query and L2 chunks with `content_segmented` | When `searchLevel2Keyword()` runs | Then it returns top 20 L2 chunks ordered by tsvector rank | Unit (mocked DB) |
| AC-4 | US-4 | L2 vector results and L2 keyword results | When RRF merge runs | Then scores follow `0.6/(k+rank_v) + 0.4/(k+rank_k)` with k=60 | Unit |
| AC-5 | US-4 | Merged L2 results and L1 article matches | When L1 boosting runs | Then L2 chunks whose parent article is in L1 top 10 get a score boost | Unit |
| AC-6 | US-4 | Boosted and sorted results | When top-k selection runs | Then top 5-8 chunks are returned, deduped by chunk ID | Unit |
| AC-7 | US-5 | A retrieval result | When examined | Then it includes article title, url, section, publishedDate, chunk content, and chunk level | Unit |
| AC-8 | US-4 | A chunk that appears in both L2 vector and L2 keyword results | When RRF scoring runs | Then it receives a higher combined score | Unit |
| AC-9 | US-1 | An empty database | When `hybridSearch()` runs | Then it returns an empty array without errors | Unit |
| AC-10 | US-6 | An English query like "Who is the dean?" | When embedded and searched | Then it returns Chinese chunks about 院长 | Integration |

## 6. Blast Radius

### Components Affected

| Component | Impact | Risk Level |
|-----------|--------|------------|
| `apps/web/lib/retrieval.ts` | Direct — full rewrite for two-level strategy | High |
| `apps/web/lib/rag.ts` | Direct consumer — calls `hybridSearch()` | Med |
| `apps/web/lib/embeddings.ts` | Indirect — retrieval uses `generateQueryEmbedding()` | Low |
| `apps/web/app/api/chat/route.ts` | Indirect consumer — calls rag pipeline | Low |

### Data Impact

- **Database changes**: None — reads from Chunk + Article tables (L1/L2 distinction via `level` column added in FEAT-002)
- **Existing data**: Read-only
- **Rollback complexity**: Simple — module is stateless

## 7. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|-------------|-------------|------------------|
| Flat single-level search (ignoring L1/L2) | Loses article-level relevance signal | Two-level search with L1 boosting |
| Only L1 search (article-level) | Misses fine-grained section matches in long articles | L2 provides section-level precision |
| SQL string concatenation | SQL injection risk | Parameterized queries only |
| TypeORM query builder for pgvector | Does not support `<=>` operator | Raw SQL via `dataSource.query()` |
| Returning all chunks without limit | LLM context overflow | Top 5-8 after scoring |
| Separate queries without connection | L1 and L2 results are independent | L1 results boost L2 scores for same article |

## 8. Constraints

| Constraint | Source | Implication |
|-----------|--------|-------------|
| pgvector `<=>` cosine distance operator | Migration + ADR-0006 | Raw SQL required; `vector_cosine_ops` HNSW index |
| HNSW index: m=16, ef_construction=64 | Migration | Fast approximate nearest neighbor; no runtime config needed |
| GIN index on `to_tsvector('simple', content_segmented)` | Migration | Uses `'simple'` config (no stemming) with jieba-segmented text |
| Must filter by `level` column in queries | ADR-0006 | `WHERE level = 1` for L1, `WHERE level = 2` for L2 |
| No similarity threshold (rank-based only) | ADR-0006 | RRF score determines ranking; LLM handles "insufficient context" |
| No cross-encoder reranker for v1 | ADR-0006 | L1 boost (1.3x) acts as soft reranker; evaluate and add reranker in v2 if needed |
| Max 5-8 results to LLM | Design decision | Balance context quality and token budget |
| Embedding model: qwen3-embedding:4b (1024 dims) | ADR-0006 | Query embedding generated via local Ollama at query time |
| Cosine distance, not L2 or inner product | ADR-0006 | Direction-based; robust without L2 normalization |

## 9. Security Requirements

| Requirement | Priority | Implementation |
|------------|----------|----------------|
| SQL injection prevention | Must | All queries use parameterized placeholders |
| No user input in raw SQL | Must | Query text and embedding passed as parameters |

### Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|------------|
| SQL injection via search query | Malicious user input | Parameterized queries only |
| DoS via expensive queries | Very long queries | Limit query length; HNSW bounds search |

## 10. Out of Scope

- Cross-encoder reranker model
- Query expansion / rewriting
- Semantic caching of query results
- Multi-turn conversation context in retrieval
- Metadata filtering (e.g., "only articles from 2024")
- Adjustable RRF weights per query

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| L1 boosting over-weights article matches | Med | Med | Tunable boost factor; test with evaluation questions |
| Keyword search ineffective for English queries | High | Med | Vector search compensates; RRF weights favor vector (0.6) |
| Two-level search slower than single-level | Low | Low | Three parallel queries; HNSW + GIN indexes keep each fast |
| Query embedding dimension mismatch | Low | High | Both use qwen3-embedding:4b at 1024 dims; unit test validates |
| HNSW index not built | Low | High | Migration creates it; verify with `\d chunks` |

## 12. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Retrieval relevance | 8/10 queries return relevant top-3 chunks | Manual eval with sample questions |
| Citation accuracy | Correct source article in top results | Eval question source_url matching |
| Query latency | < 500ms for full hybrid search | Timer in retrieval function |
| L1 boost effectiveness | Articles matched at L1 have L2 chunks in final results | Unit test AC-5 |
| English query recall | Relevant Chinese chunks found for English queries | Integration test AC-10 |
| Test coverage | >= 60% on retrieval module | Vitest coverage report |

## 13. Open Questions

- [ ] What should the L1 boost factor be? Proposal: `rrf_score * 1.3` for chunks whose article is in L1 top 10
- [ ] Should we fall back to L1-only results if no L2 chunks match? Yes, for short articles with only L1 chunks
- [ ] Should RRF weights be configurable via env vars? Not for v1

---

## Sign-off

- [ ] Stakeholder review complete
- [ ] AC agreed upon
- [ ] Ready for Phase 2 (Design)
