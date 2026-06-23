# Phase 5: Archive — Hierarchical Chunking & Embedding Pipeline

> **Status**: ARCHIVED
> **Feature ID**: FEAT-002
> **Date Completed**: 2026-06-24
> **Duration**: 2026-06-24 to 2026-06-24

---

## Summary

Delivered a hierarchical chunking and embedding pipeline for the TKE RAG corpus. The feature replaced the previous flat chunking and old embedding path with Level 1 article chunks, Level 2 section chunks for longer articles, jieba-based segmentation for keyword retrieval, and Ollama-backed `qwen3-embedding:4b` embeddings fixed at 1024 dimensions for pgvector HNSW compatibility. The end-to-end ingest pipeline was verified against the real local corpus and produced 1,638 chunks from 811 articles.

## Documents

| Phase | Document | Final Status |
|-------|----------|-------------|
| 1. Proposal | [01-proposal.md](./01-proposal.md) | Approved |
| 2. Design | [02-design.md](./02-design.md) | Approved |
| 3. Tasks | [03-tasks.md](./03-tasks.md) | Complete |
| 4. Verification | [04-verification.md](./04-verification.md) | PASS |

## Acceptance Criteria Results

| AC ID | Description | Result |
|-------|-------------|--------|
| AC-1 | Every article produces exactly one L1 chunk | PASS |
| AC-2 | Article >= 800 chars produces L1 + L2 chunks | PASS |
| AC-3 | Article < 800 chars produces only L1, zero L2 | PASS |
| AC-4 | Adjacent L2 chunks overlap by ~100 chars | PASS |
| AC-5 | L1 chunk has metadata prefix (title, date, section) | PASS |
| AC-6 | Chinese text returns jieba-segmented words | PASS |
| AC-7 | Embedding returns 1024-dim array via Ollama | PASS |
| AC-8 | Ingest skips articles with existing chunks | DEFERRED |
| AC-9 | Long article L1 truncates while L2 covers full text | PASS |
| AC-10 | Ollama unreachable throws clear error | PASS |

## Key Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Use hierarchical L1 + L2 chunking | Preserves article-level context while still supporting fine-grained retrieval on longer articles | Flat chunking, article-only chunking |
| Use local Ollama `qwen3-embedding:4b` | Removes external embedding dependency and supports multilingual retrieval | SiliconFlow BGE-M3, other Ollama models |
| Keep embedding size at 1024 | Preserves pgvector HNSW compatibility and matches the validated schema/runtime path | 2560-dim embeddings, no HNSW path |
| Add explicit `dimensions: 1024` to Ollama embed requests | Prevents runtime drift between model output and pgvector schema | Relying on Ollama defaults only |
| Normalize `publishedDate` during ingest | Fixed a real runtime crash caused by string-valued dates coming back from the database layer | Assuming `publishedDate` is always a JS `Date` |

## Lessons Learned

### What Went Well

- The chunking and embedding modules were covered with focused unit tests before and after refactors.
- Live ingestion against the real corpus validated the design beyond mocked tests.
- The Level 1 / Level 2 split produced sensible counts: one L1 per article and additional L2 chunks only where needed.

### What Could Be Improved

- AC-8 should be backed by an automated integration test instead of being deferred.
- Verification notes should be refreshed whenever the implementation changes after Phase 4 begins.
- Long-running ingest monitoring would benefit from a dedicated progress or resume script.

### Action Items for Future Work

- [ ] Add an integration test that proves rerunning ingest skips already chunked articles.
- [ ] Add a small inspection/reporting script for chunk counts and sample previews.
- [ ] Consider persisting ingest progress metrics for large corpus runs.

## Files Changed

```text
apps/web/entities/chunk.entity.ts                     (modified)
apps/web/lib/__tests__/chunking.test.ts               (created)
apps/web/lib/__tests__/constants.test.ts              (created)
apps/web/lib/__tests__/date-utils.test.ts             (created)
apps/web/lib/__tests__/embeddings.test.ts             (created)
apps/web/lib/__tests__/fixtures/articles.ts           (created)
apps/web/lib/__tests__/segmentation.test.ts           (created)
apps/web/lib/chunking.ts                              (modified)
apps/web/lib/constants.ts                             (created)
apps/web/lib/date-utils.ts                            (created)
apps/web/lib/embeddings.ts                            (modified)
apps/web/lib/run-migrations.ts                        (modified)
apps/web/lib/segmentation.ts                          (created)
apps/web/migrations/1700000000000-InitialSchema.ts    (modified)
apps/web/migrations/1700000000002-AddChunkLevel.ts    (created)
apps/web/types/index.ts                               (created)
docs/active/FEAT-002-chunking-embedding/*             (documented through all 5 phases)
docs/decisions/0006-embedding-model-and-chunking-strategy.md (modified)
scripts/ingest.ts                                     (modified)
scripts/smoke-test-embeddings.ts                      (created)
vitest.config.ts                                      (created)
```

## Related Commits

```text
Uncommitted in current workspace
```

---

## Archive Checklist

- [x] All phases completed and documented
- [ ] Feature merged to main branch
- [x] Feature folder moved from `docs/active/` to `docs/archive/`
- [ ] No open issues or blockers remaining
- [x] AGENTS.md updated if conventions changed
