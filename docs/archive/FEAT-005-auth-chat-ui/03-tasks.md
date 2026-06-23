# Phase 3: Task Breakdown — Authentication & Chat UI

> **Status**: IN PROGRESS
> **Design**: [02-design.md](./02-design.md)
> **Author**: Agent
> **Date**: 2026-06-24
> **Feature ID**: FEAT-005

---

## TDD Workflow Reminder

Every implementation task follows **Red-Green-Refactor**:

1. **Red** — Write a failing test that defines the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up while keeping tests green

---

## Task List

### Setup & Test Scaffolding

- [x] **T-001**: Define FEAT-005 task sequencing
  - AC: N/A
  - Estimated effort: S
  - Details: Convert the approved design into ordered test-first work for auth, pages, and chat UI.
  - Files: `docs/active/FEAT-005-auth-chat-ui/03-tasks.md`

- [x] **T-002**: Set up React UI test infrastructure
  - AC: N/A
  - Estimated effort: M
  - Details: Add the minimal client-component testing dependencies and configure Vitest for mixed `node` and `jsdom` suites.
  - Files: `package.json`, `package-lock.json`, `vitest.config.ts`, `apps/web/test/setup-ui.ts`

### Test-First Implementation

- [x] **T-003**: Write failing auth and page-guard tests
  - AC: AC-3, AC-6, AC-8, AC-9
  - Estimated effort: M
  - Test file: `apps/web/lib/__tests__/auth.test.ts`, `apps/web/app/login/page.test.tsx`, `apps/web/app/chat/page.test.tsx`
  - Details: Verify credential validation, session verification success/failure, login-page redirect when authenticated, and chat-page redirect when unauthenticated.

- [x] **T-004**: Implement auth hardening needed to satisfy tests
  - AC: AC-3, AC-6, AC-8, AC-9
  - Estimated effort: S
  - Files: `apps/web/lib/auth.ts`, page files only if tests require changes
  - Details: Keep behavior stable while extracting clearer constants or return paths if tests expose gaps.

- [x] **T-005**: Write failing login-form tests
  - AC: AC-1, AC-2
  - Estimated effort: M
  - Test file: `apps/web/components/__tests__/login-form.test.tsx`
  - Details: Assert valid submit posts credentials and navigates, invalid response shows error, and submit button reflects loading state.

- [x] **T-006**: Implement login form UX and visual refresh
  - AC: AC-1, AC-2
  - Estimated effort: M
  - Files: `apps/web/components/login-form.tsx`, `apps/web/app/login/page.tsx`, `apps/web/app/globals.css`
  - Details: Improve layout and wording while preserving the auth API contract.

- [x] **T-007**: Write failing chat, markdown, and citation rendering tests
  - AC: AC-4, AC-5, AC-7, BR-7
  - Estimated effort: M
  - Test file: `apps/web/components/__tests__/chat-box.test.tsx`, `apps/web/components/__tests__/chat-message.test.tsx`, `apps/web/components/__tests__/citation-list.test.tsx`
  - Details: Assert empty state, optimistic user message, assistant response rendering, loading indicator, disabled input, safe markdown rendering, and citation metadata display.

- [x] **T-008**: Implement chat UI refresh, markdown rendering, and citation styling
  - AC: AC-4, AC-5, AC-7, BR-7
  - Estimated effort: L
  - Files: `apps/web/components/chat-box.tsx`, `apps/web/components/chat-message.tsx`, `apps/web/components/citation-list.tsx`, `apps/web/app/chat/page.tsx`, `apps/web/app/globals.css`
  - Details: Deliver the research-console look, assistant markdown rendering, and stronger answer-verification presentation.

### Refactor

- [x] **T-009**: Refactor pass
  - AC: All
  - Estimated effort: S
  - Details: Remove duplication, stabilize copy/constants if needed, and keep the component boundaries clean.

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
| T-001 | Done | Agent | 2026-06-24 | 2026-06-24 | FEAT-005 task order aligned to approved design |
| T-002 | Done | Agent | 2026-06-24 | 2026-06-24 | Added Testing Library, jsdom-compatible setup, and Vitest JSX support |
| T-003 | Done | Agent | 2026-06-24 | 2026-06-24 | Added auth helper tests plus login/chat page guard tests |
| T-004 | Done | Agent | 2026-06-24 | 2026-06-24 | No auth code changes were required after the RED pass; existing behavior satisfied the tests |
| T-005 | Done | Agent | 2026-06-24 | 2026-06-24 | Added login-form tests for success, invalid credentials, and pending-state locking |
| T-006 | Done | Agent | 2026-06-24 | 2026-06-24 | Refreshed login layout and disabled the full form while login is pending |
| T-007 | Done | Agent | 2026-06-24 | 2026-06-24 | Added chat-box, chat-message, citation-list, and auth-route tests |
| T-008 | Done | Agent | 2026-06-24 | 2026-06-24 | Implemented assistant markdown rendering, trimmed chat submission, citation restyling, and chat-shell refresh |
| T-009 | Done | Agent | 2026-06-24 | 2026-06-24 | Completed full test, coverage, typecheck, build, and changed-file validation |

---

## Blockers & Dependencies

| Task | Blocked By | Description | Resolution |
|------|-----------|-------------|------------|
| T-003 | T-002 | Page and component tests need the UI test harness first | Add `jsdom`/Testing Library setup before writing tests |
| T-006 | T-005 | Login UI changes should be driven by failing tests | Implement only after RED is verified |
| T-008 | T-007 | Chat markdown and citation changes should be test-led | Implement only after RED is verified |

---

## Sign-off

- [x] All tasks mapped to ACs
- [x] TDD order maintained (test before implementation)
- [x] Ready for Phase 4 (Verification)
