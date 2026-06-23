# Phase 3: Task Breakdown — RAG Pipeline & LLM Integration

> **Status**: IN PROGRESS
> **Design**: [02-design.md](./02-design.md)
> **Author**: Agent
> **Date**: 2026-06-24
> **Feature ID**: FEAT-004

---

## TDD Workflow Reminder

Every implementation task follows **Red-Green-Refactor**:

1. **Red** — Write a failing test that defines the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up while keeping tests green

---

## Task List

### Setup & Test Scaffolding

- [x] **T-001**: Define FEAT-004 task sequencing
  - AC: N/A
  - Estimated effort: S
  - Details: Translate approved design into concrete RED/GREEN steps for `llm.ts`, `rag.ts`, and `/api/chat`.
  - Files: `docs/active/FEAT-004-rag-pipeline/03-tasks.md`

### Test-First Implementation

- [x] **T-002**: Write failing tests for lazy LLM client construction and prompt contract
  - AC: AC-4, AC-6, AC-8
  - Estimated effort: M
  - Test file: `apps/web/lib/__tests__/llm.test.ts`
  - Details: Assert `openai` client is not constructed at import time, request messages include the system prompt plus `Context/Question` payload, and generation failures surface as catchable errors.

- [x] **T-003**: Implement lazy LLM client construction and stabilize LLM constants
  - AC: AC-4, AC-6, AC-8
  - Estimated effort: M
  - Files: `apps/web/lib/llm.ts`
  - Details: Replace eager top-level client with `getLlmClient()`, extract named settings, and preserve sync plus streaming API surface.

- [x] **T-004**: Write failing tests for RAG refusal path, context flow, and citation deduplication
  - AC: AC-1, AC-2, AC-3, AC-5, AC-7
  - Estimated effort: M
  - Test file: `apps/web/lib/__tests__/rag.test.ts`
  - Details: Mock retrieval and LLM modules to assert no-LLM refusal on empty retrieval, numbered context handoff, and one citation per URL.

- [x] **T-005**: Implement RAG helper cleanup and stable fallback behavior
  - AC: AC-1, AC-2, AC-3, AC-5, AC-7
  - Estimated effort: M
  - Files: `apps/web/lib/rag.ts`
  - Details: Extract constants/helpers for fallback answer and citation building, harden date normalization, and keep the public response contract unchanged.

- [x] **T-006**: Write failing route tests for auth, validation, and response shaping
  - AC: AC-1, AC-8
  - Estimated effort: S
  - Test file: `apps/web/app/api/chat/__tests__/route.test.ts`
  - Details: Assert `401` for missing session, `400` for invalid message, and success JSON contains only `answer` and `citations`.

- [x] **T-007**: Implement route hardening needed to satisfy tests
  - AC: AC-1, AC-8
  - Estimated effort: S
  - Files: `apps/web/app/api/chat/route.ts`
  - Details: Tighten input handling only if tests reveal gaps while keeping the route response shape stable for the UI.

### Refactor

- [x] **T-008**: Refactor pass
  - AC: All
  - Estimated effort: S
  - Details: Remove duplication, tighten names, and keep all FEAT-004 tests green without expanding scope into UI work.

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
| T-001 | Done | Agent | 2026-06-24 | 2026-06-24 | Phase 3 sequence aligned to approved design |
| T-002 | Done | Agent | 2026-06-24 | 2026-06-24 | RED verified: `llm.ts` eagerly constructed OpenAI client on import |
| T-003 | Done | Agent | 2026-06-24 | 2026-06-24 | Replaced eager client with lazy `getLlmClient()` and named settings |
| T-004 | Done | Agent | 2026-06-24 | 2026-06-24 | RED verified: invalid `publishedDate` crashed citation building |
| T-005 | Done | Agent | 2026-06-24 | 2026-06-24 | Added citation helper, shared fallback constant, and safe date normalization |
| T-006 | Done | Agent | 2026-06-24 | 2026-06-24 | Added route tests for `401`, `400`, and success JSON contract |
| T-007 | Done | Agent | 2026-06-24 | 2026-06-24 | No route code changes required; existing implementation satisfied tests |
| T-008 | Done | Agent | 2026-06-24 | 2026-06-24 | Completed full test, coverage, typecheck, build, and changed-file lint pass |

---

## Blockers & Dependencies

| Task | Blocked By | Description | Resolution |
|------|-----------|-------------|------------|
| T-003 | T-002 | Need failing tests before modifying `llm.ts` | Run focused Vitest RED first |
| T-005 | T-004 | RAG cleanup must be justified by failing behavior tests | Implement only after mocked RAG tests fail |
| T-007 | T-006 | Route changes should only follow route-level failures | Keep route unchanged unless tests require edits |

---

## Sign-off

- [x] All tasks mapped to ACs
- [x] TDD order maintained (test before implementation)
- [x] Ready for Phase 4 (Verification)
