# Phase 3: Task Breakdown — Hierarchical Chunking & Embedding Pipeline

> **Status**: COMPLETE
> **Design**: [02-design.md](./02-design.md)
> **Author**: Agent
> **Date**: 2026-06-24
> **Feature ID**: FEAT-002

---

## TDD Workflow Reminder

Every implementation task follows **Red-Green-Refactor**:

1. **Red** — Write a failing test that defines the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up while keeping tests green

---

## Task List

### Setup & Infrastructure

- [x] **T-001**: Set up test infrastructure
  - AC: N/A (enabler)
  - Estimated effort: S
  - Details: Install vitest + coverage, create config, create test fixtures, add npm scripts
  - Files: `vitest.config.ts`, `package.json`, `apps/web/lib/__tests__/fixtures/articles.ts`

- [x] **T-002**: Create shared constants module
  - AC: N/A (enabler for DRY policy)
  - Estimated effort: S
  - Details: `ChunkLevel` enum, `MessageRole` enum, all named constants (sizing, env-based tuning)
  - Files: `apps/web/lib/constants.ts`

### Segmentation — TDD

- [x] **T-003**: Write failing tests for segmentation (RED)
  - AC: AC-6
  - Estimated effort: S
  - Test file: `apps/web/lib/__tests__/segmentation.test.ts`
  - Details: 5 tests — Chinese segmentation, English word preservation, empty input, whitespace, newlines

- [x] **T-004**: Implement segmentation to pass tests (GREEN)
  - AC: AC-6
  - Estimated effort: S
  - Files: `apps/web/lib/segmentation.ts`
  - Details: nodejieba wrapper with Chinese/English segment splitting to preserve ASCII words intact

### Chunking — TDD

- [x] **T-005**: Write failing tests for hierarchical chunking (RED)
  - AC: AC-1, AC-2, AC-3, AC-4, AC-5, AC-9
  - Estimated effort: M
  - Test file: `apps/web/lib/__tests__/chunking.test.ts`
  - Details: 20 tests covering L1-only, L1+L2, metadata prefix, overlap, truncation, edge cases

- [x] **T-006**: Rewrite chunking to pass tests (GREEN)
  - AC: AC-1, AC-2, AC-3, AC-4, AC-5, AC-9
  - Estimated effort: M
  - Files: `apps/web/lib/chunking.ts`
  - Details: Full rewrite from flat to hierarchical L1+L2 strategy

### Embeddings — TDD

- [x] **T-007**: Write failing tests for Ollama embedding client (RED)
  - AC: AC-7, AC-10
  - Estimated effort: S
  - Test file: `apps/web/lib/__tests__/embeddings.test.ts`
  - Details: 8 tests — correct dimensions, Ollama API call, batch splitting, error handling (mocked fetch)

- [x] **T-008**: Rewrite embeddings to pass tests (GREEN)
  - AC: AC-7, AC-10
  - Estimated effort: S
  - Files: `apps/web/lib/embeddings.ts`
  - Details: Switch from OpenAI SDK to direct `fetch()` to Ollama `/api/embed`

### Database & Ingestion

- [x] **T-009**: Create migration for `level` column
  - AC: N/A (enabler)
  - Estimated effort: S
  - Files: `apps/web/migrations/1700000000002-AddChunkLevel.ts`, `apps/web/lib/run-migrations.ts`
  - Details: `ALTER TABLE chunks ADD COLUMN level SMALLINT DEFAULT 1` + index

- [x] **T-010**: Update chunk entity
  - AC: N/A (enabler)
  - Estimated effort: S
  - Files: `apps/web/entities/chunk.entity.ts`
  - Details: Add `level` field with `ChunkLevel` type, update comment

- [x] **T-011**: Rewrite ingestion script
  - AC: AC-8 (partial — idempotency)
  - Estimated effort: M
  - Files: `scripts/ingest.ts`
  - Details: Two-level chunking + jieba segmentation + Ollama embedding

### Refactor

- [x] **T-012**: Centralize shared types
  - AC: N/A (DRY policy)
  - Estimated effort: M
  - Files: `apps/web/types/index.ts` + 9 consumer files updated
  - Details: Extracted `Citation`, `ChatMessage`, `DisplayMessage`, `LlmMessage`, `RagResponse`, `RetrievalResult`, `ChunkMetadata`, `ChunkData` to single source of truth. Eliminated 3 `Citation` duplicates. Replaced all magic `"user"`/`"assistant"` strings with `MessageRole` enum.

- [x] **T-013**: Move tests to colocated structure
  - AC: N/A (convention)
  - Estimated effort: S
  - Details: Moved from `__tests__/lib/` to `apps/web/lib/__tests__/`

- [x] **T-014**: Setup ESLint + Prettier
  - AC: N/A (code quality)
  - Estimated effort: S
  - Files: `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `package.json`
  - Details: ESLint 9 flat config with TypeScript, magic string detection, no-any. Prettier with project conventions. Added `npm run check` pipeline.

- [x] **T-015**: Reconfirm embedding schema at 1024 for HNSW compatibility
  - AC: AC-7
  - Estimated effort: S
  - Files: `apps/web/lib/constants.ts`, `apps/web/entities/chunk.entity.ts`, `apps/web/migrations/1700000000000-InitialSchema.ts`, `apps/web/lib/embeddings.ts`, `apps/web/lib/run-migrations.ts`, `.env.example`
  - Details: Keep runtime default and schema at 1024, explicitly request 1024 dimensions from Ollama, and avoid accidental application of stray generated migrations.

---

## Progress Tracker

| Task | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| T-001 | Done | 2026-06-24 | 2026-06-24 | vitest 3.2.6 + coverage v8 |
| T-002 | Done | 2026-06-24 | 2026-06-24 | |
| T-003 | Done | 2026-06-24 | 2026-06-24 | RED: 5 tests written, all fail |
| T-004 | Done | 2026-06-24 | 2026-06-24 | GREEN: segmentation passes |
| T-005 | Done | 2026-06-24 | 2026-06-24 | RED: 20 tests written, all fail |
| T-006 | Done | 2026-06-24 | 2026-06-24 | GREEN: chunking passes |
| T-007 | Done | 2026-06-24 | 2026-06-24 | RED: 8 tests written, all fail |
| T-008 | Done | 2026-06-24 | 2026-06-24 | GREEN: embeddings passes |
| T-009 | Done | 2026-06-24 | 2026-06-24 | Migration ran successfully |
| T-010 | Done | 2026-06-24 | 2026-06-24 | |
| T-011 | Done | 2026-06-24 | 2026-06-24 | |
| T-012 | Done | 2026-06-24 | 2026-06-24 | 7 problems fixed, 0 type errors |
| T-013 | Done | 2026-06-24 | 2026-06-24 | |
| T-014 | Done | 2026-06-24 | 2026-06-24 | `npm run check` fully green |
| T-015 | Done | 2026-06-24 | 2026-06-24 | Reconfirmed 1024-dim schema and explicit Ollama dimensions |

---

## Sign-off

- [x] All tasks mapped to ACs
- [x] TDD order maintained (test before implementation)
- [x] Ready for Phase 4 (Verification)
