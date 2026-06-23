# Phase 5: Archive — Authentication & Chat UI

> **Status**: ARCHIVED
> **Feature ID**: FEAT-005
> **Date Completed**: 2026-06-24
> **Duration**: 2026-06-23 to 2026-06-24

---

## Summary

FEAT-005 completed the authenticated UI feature set for the v1 chatbot. The login flow, session guards, logout path, chat composer, assistant message rendering, and citation display are now all covered by tests. The UI was refreshed toward an academic “research console” identity, assistant responses now render markdown safely via `react-markdown`, and the chat composer trims whitespace and disables correctly during pending requests. The implementation stayed within the existing auth and chat API contracts.

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
| AC-1 | Valid credentials redirect the user to `/chat` | PASS |
| AC-2 | Invalid credentials show an error and do not redirect | PASS |
| AC-3 | Unauthenticated access to `/chat` redirects to `/login` | PASS |
| AC-4 | Chat submission shows user and assistant messages | PASS |
| AC-5 | Citations show title, section, date, and link | PASS |
| AC-6 | Logout destroys the session and returns to login | PASS |
| AC-7 | Loading indicator is visible and composer is disabled during answer generation | PASS |
| AC-8 | `verifySession()` returns the session payload for a valid token | PASS |
| AC-9 | Expired or tampered sessions return null | PASS |

## Key Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Keep FEAT-005 focused on auth/chat UI rather than a full design-system migration | Deliver the required evaluator-facing experience without exploding scope | Doing the full ADR-0002 shadcn/TanStack migration in the same feature |
| Render only assistant messages as markdown | Preserve safe LLM formatting while keeping user input literal | Rendering markdown for both sides |
| Move page and route tests out of the App Router directory | Avoid Next build artifacts being confused by colocated tests | Keeping tests under `app/**/__tests__` |
| Use a research-console visual direction | Better matches the academic corpus-verification use case than a generic SaaS chat | Keeping the original plain Tailwind layout or over-stylizing into a dashboard |

## Lessons Learned

### What Went Well

- The feature gained broad behavioral coverage quickly once the React test harness was in place.
- Several UX improvements came directly from meaningful RED tests, especially full-form pending locking and trimmed chat submission.
- Markdown rendering fit cleanly into the existing message component once user/assistant responsibilities were separated.

### What Could Be Improved

- The Vitest config still uses a deprecated `environmentMatchGlobs` setting and should move to `test.projects`.
- `auth.ts` statement coverage is acceptable but not as strong as the component-side coverage.

### Action Items for Future Work

- [ ] Migrate Vitest environment configuration from `environmentMatchGlobs` to `test.projects`.
- [ ] Decide whether to fully adopt ADR-0002’s shadcn/TanStack stack in a later frontend refinement feature.
- [ ] Consider browser-based visual verification and screenshots for future UI archive records.

## Files Changed

```text
apps/web/app/chat/page.tsx                         (modified)
apps/web/app/globals.css                           (modified)
apps/web/app/login/page.tsx                        (modified)
apps/web/components/chat-box.tsx                   (modified)
apps/web/components/chat-message.tsx               (modified)
apps/web/components/citation-list.tsx              (modified)
apps/web/components/login-form.tsx                 (modified)
apps/web/components/__tests__/chat-box.test.tsx    (created)
apps/web/components/__tests__/chat-message.test.tsx (created)
apps/web/components/__tests__/citation-list.test.tsx (created)
apps/web/components/__tests__/login-form.test.tsx  (created)
apps/web/lib/__tests__/auth.test.ts                (created)
apps/web/test/app/api-auth-routes.test.ts          (created)
apps/web/test/app/api-chat-route.test.ts           (created)
apps/web/test/app/chat-page.test.tsx               (created)
apps/web/test/app/login-page.test.tsx              (created)
apps/web/test/setup-ui.ts                          (created)
docs/active/FEAT-005-auth-chat-ui/02-design.md     (created)
docs/active/FEAT-005-auth-chat-ui/03-tasks.md      (created)
docs/active/FEAT-005-auth-chat-ui/04-verification.md (created)
docs/active/FEAT-005-auth-chat-ui/05-archive.md    (created)
package.json                                       (modified)
package-lock.json                                  (modified)
vitest.config.ts                                   (modified)
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
