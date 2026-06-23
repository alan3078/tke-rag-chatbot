# Phase 5: Archive — RAG Pipeline & LLM Integration

> **Status**: ARCHIVED
> **Feature ID**: FEAT-004
> **Date Completed**: 2026-06-24
> **Duration**: 2026-06-23 to 2026-06-24

---

## Summary

FEAT-004 completed the backend RAG answer path verification and hardening work. The feature now has dedicated tests for the LLM client, RAG orchestration, and `/api/chat` route behavior; `llm.ts` no longer constructs the OpenRouter client at import time; and citation building now safely handles malformed or inconsistent date values without crashing the request. The feature stayed intentionally backend-only, leaving markdown rendering to FEAT-005 and streaming to later work.

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
| AC-1 | `ragQuery()` returns an answer derived from retrieved context | PASS |
| AC-2 | Unique article URLs appear exactly once in citations | PASS |
| AC-3 | Empty retrieval returns an insufficient-information answer | PASS |
| AC-4 | System prompt instructs same-language answers | PASS |
| AC-5 | Retrieved chunks are formatted into numbered context for the LLM | PASS |
| AC-6 | LLM API call includes the constrained system prompt and final context/question message | PASS |
| AC-7 | Multiple chunks from the same article produce one citation entry | PASS |
| AC-8 | LLM/build failures remain route-catchable and import-time env coupling is removed | PASS |

## Key Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Keep FEAT-004 backend-only | Prevent scope creep and keep markdown/streaming concerns separate | Folding markdown or streaming into the same feature |
| Replace eager OpenAI client creation with lazy `getLlmClient()` | Fix `npm run build` failure caused by import-time env resolution | Keeping eager construction and relying on root `.env` loading |
| Deduplicate citations by URL only | URL is the most stable article identifier for user-facing citations | Deduping by title or title + section |
| Normalize citation dates through a shared helper | Prevent malformed date values from crashing the answer path | Formatting inline inside `rag.ts` |

## Lessons Learned

### What Went Well

- Focused RED/GREEN tests surfaced the real build blocker quickly.
- Existing `/api/chat` boundaries were already good enough that route code needed no behavior changes.
- A small shared date helper solved both ingestion and RAG citation formatting problems cleanly.

### What Could Be Improved

- `llm.ts` originally mixed configuration, prompt construction, and client instantiation too tightly.
- Coverage on `llm.ts` is above threshold but still leaves streaming branches less exercised than sync generation.

### Action Items for Future Work

- [ ] Add FEAT-005 markdown rendering using `react-markdown` in the chat UI.
- [ ] Add a later feature for streaming answers from `/api/chat` to the UI.
- [ ] Consider extra tests for `generateAnswerStream()` when streaming work is picked up.

## Files Changed

```text
apps/web/app/api/chat/__tests__/route.test.ts      (created)
apps/web/lib/__tests__/llm.test.ts                 (created)
apps/web/lib/__tests__/rag.test.ts                 (created)
apps/web/lib/date-utils.ts                         (modified)
apps/web/lib/llm.ts                                (modified)
apps/web/lib/rag.ts                                (modified)
docs/active/FEAT-004-rag-pipeline/02-design.md    (created)
docs/active/FEAT-004-rag-pipeline/03-tasks.md     (created)
docs/active/FEAT-004-rag-pipeline/04-verification.md (created)
docs/active/FEAT-004-rag-pipeline/05-archive.md   (created)
```

## Related Commits

```text
No commit created in this session
```

---

## Archive Checklist

- [x] All phases completed and documented
- [ ] Feature merged to main branch
- [x] Feature folder moved from `docs/active/` to `docs/archive/`
- [x] No open issues or blockers remaining
- [ ] AGENTS.md updated if conventions changed
