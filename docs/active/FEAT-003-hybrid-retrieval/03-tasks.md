# Phase 3: Task Breakdown — Two-Level Hybrid Retrieval (Vector + Keyword + RRF)

> **Status**: IN PROGRESS
> **Design**: [02-design.md](./02-design.md)
> **Author**: Agent
> **Date**: 2026-06-24
> **Feature ID**: FEAT-003

---

## TDD Workflow Reminder

Every implementation task follows **Red-Green-Refactor**:

1. **Red** — Write a failing test that defines the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up while keeping tests green

---

## Task List

### Setup & Test Scaffolding

- [x] **T-001**: Create retrieval test scaffolding
  - AC: N/A
  - Estimated effort: S
  - Details: Mock `getDataSource()` and `generateQueryEmbedding()`, define L1/L2 fixtures, and capture raw SQL calls.
  - Files: `apps/web/lib/__tests__/retrieval.test.ts`

### Test-First Implementation

- [x] **T-002**: Write failing tests for Level 1 and Level 2 query functions
  - AC: AC-1, AC-2, AC-3, AC-7, AC-9
  - Estimated effort: M
  - Test file: `apps/web/lib/__tests__/retrieval.test.ts`
  - Details: Assert SQL level filters, top-k limits, empty-result handling, and metadata fields including chunk level.

- [x] **T-003**: Implement Level 1 and Level 2 search helpers
  - AC: AC-1, AC-2, AC-3, AC-7, AC-9
  - Estimated effort: M
  - Files: `apps/web/lib/retrieval.ts`, `apps/web/types/index.ts`
  - Details: Split the flat search into `searchLevel1()`, `searchLevel2Vector()`, and `searchLevel2Keyword()` helpers with parameterized SQL.

- [x] **T-004**: Write failing tests for RRF merge, L1 boosting, and result selection
  - AC: AC-4, AC-5, AC-6, AC-8
  - Estimated effort: M
  - Test file: `apps/web/lib/__tests__/retrieval.test.ts`
  - Details: Assert exact RRF math, dedupe by chunk ID, stronger score when both L2 arms match, and L1 fallback behavior.

- [x] **T-005**: Implement RRF merge, L1 boost, fallback, and final hybridSearch orchestration
  - AC: AC-4, AC-5, AC-6, AC-8
  - Estimated effort: M
  - Files: `apps/web/lib/retrieval.ts`
  - Details: Orchestrate embedding generation, three search arms, merged scoring, fallback to L1-only results, and final top-k selection.

- [x] **T-006**: Write failing tests for bilingual and consumer-facing formatting behavior
  - AC: AC-10
  - Estimated effort: S
  - Test file: `apps/web/lib/__tests__/retrieval.test.ts`
  - Details: Mock an English query path and verify returned Chinese chunk data plus stable `formatContext()` output.

- [x] **T-007**: Implement bilingual path and context formatting cleanup
  - AC: AC-10
  - Estimated effort: S
  - Files: `apps/web/lib/retrieval.ts`
  - Details: Preserve embedding-first cross-lingual retrieval path and ensure formatted context remains citation-ready.

### Refactor

- [x] **T-008**: Refactor pass
  - AC: All
  - Estimated effort: S
  - Details: Remove duplication, improve internal types and naming, and keep the module small and readable.

---

## Effort Legend

| Size | Meaning | Approx. Time |
|------|---------|---------------|
| S | Small | < 30 min |
| M | Medium | 30 min – 2 hr |
| L | Large | 2 – 4 hr |
| XL | Extra Large | 4+ hr (consider splitting) |

---

## Progress Tracker

| Task | Status | Assignee | Started | Completed | Notes |
|------|--------|----------|---------|-----------|-------|
| T-001 | Done | Agent | 2026-06-24 | 2026-06-24 | Mocked `getDataSource()` and `generateQueryEmbedding()` with SQL-capture fixtures |
| T-002 | Done | Agent | 2026-06-24 | 2026-06-24 | RED verified: current flat search failed expected three-query retrieval behavior |
| T-003 | Done | Agent | 2026-06-24 | 2026-06-24 | Added `searchLevel1()`, `searchLevel2Vector()`, and `searchLevel2Keyword()` |
| T-004 | Done | Agent | 2026-06-24 | 2026-06-24 | RED verified for RRF merge, L1 boost, dedupe, and fallback logic |
| T-005 | Done | Agent | 2026-06-24 | 2026-06-24 | Implemented two-level orchestration, scoring, boost, and L1 fallback |
| T-006 | Done | Agent | 2026-06-24 | 2026-06-24 | Added English-query retrieval test plus citation-ready `formatContext()` assertion |
| T-007 | Done | Agent | 2026-06-24 | 2026-06-24 | Preserved embedding-first bilingual path and stable consumer-facing formatting |
| T-008 | Done | Agent | 2026-06-24 | 2026-06-24 | Cleaned retrieval internals and extended shared retrieval result typing |

---

## Blockers & Dependencies

| Task | Blocked By | Description | Resolution |
|------|-----------|-------------|------------|
| T-005 | T-002, T-004 | Orchestration depends on tested helper and scoring behavior | Implement after RED steps are verified |

---

## Sign-off

- [x] All tasks mapped to ACs
- [x] TDD order maintained (test before implementation)
- [x] Ready for Phase 4 (Verification)
