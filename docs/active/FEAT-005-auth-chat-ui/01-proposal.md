# Phase 1: Proposal — Authentication & Chat UI

> **Status**: PROPOSAL
> **Author**: Agent
> **Date**: 2026-06-23
> **Feature ID**: FEAT-005

---

## 1. Problem Statement

The challenge requires a login-protected chat interface. Users must authenticate with username/password before accessing the chatbot. The chat UI must be user-friendly with message history, source citations, and proper error handling. Evaluators will use provided test credentials to access the system.

**Current state**: All UI components and auth logic exist and are functionally complete:
- `apps/web/lib/auth.ts` (63 lines) — JWT sessions via jose, HttpOnly cookies
- `apps/web/components/login-form.tsx` (85 lines) — Login form with error handling
- `apps/web/components/chat-box.tsx` (124 lines) — Chat interface with message state
- `apps/web/components/chat-message.tsx` (24 lines) — Message bubbles
- `apps/web/components/citation-list.tsx` (42 lines) — Source link display
- All route handlers exist (login, logout, chat page, API routes)

However: zero tests exist, `react-markdown` is installed but unused (LLM output renders as plain text), and the chat UI has no markdown rendering.

## 2. Business Requirements

| # | Requirement | Priority | Rationale |
|---|-------------|----------|-----------|
| BR-1 | Login gate with username/password before chatbot access | Must | Challenge: "MUST be behind authentication" (critical requirement) |
| BR-2 | Session persistence via HttpOnly cookies | Must | Secure session management |
| BR-3 | Chat interface with message history (user + assistant) | Must | Challenge: "User-friendly conversational UI with message history" |
| BR-4 | Display citation/source links with each answer | Must | Challenge: "Each answer should cite which article(s)" |
| BR-5 | Logout functionality | Must | Session management completeness |
| BR-6 | Responsive, clean UI styling | Should | UX & Deployment evaluation (10% weight) |
| BR-7 | Render markdown in LLM responses | Should | LLM outputs markdown; rendering it improves readability |

## 3. Stakeholder Analysis

| Stakeholder | Role | Concern | How We Address It |
|-------------|------|---------|-------------------|
| End User | Interacts with the chatbot | Clean UI, easy login, readable answers | Tailwind styling, message bubbles, citation links |
| Evaluator | Tests the system via provided credentials | Must be able to log in and ask questions immediately | Hardcoded demo credentials, clear login page |
| Developer | Maintains UI components | Components must be testable, modular | One responsibility per component, typed props |
| Ops / Deploy | Ensures auth works in production | Cookies must work behind Nginx reverse proxy | HttpOnly, SameSite, Secure flags properly configured |

## 4. User Stories

- **US-1**: As an evaluator, I want to log in with provided credentials and immediately see the chat interface, so that I can start testing.
- **US-2**: As a user, I want to type a question and see the answer appear in a chat bubble, so that the interaction feels conversational.
- **US-3**: As a user, I want to see clickable source links below each answer, so that I can verify the information.
- **US-4**: As a user, I want to log out and have my session destroyed, so that my access is terminated.
- **US-5**: As a user, I want to see a loading indicator while the answer is being generated, so that I know the system is working.

## 5. Acceptance Criteria (AC)

| AC ID | User Story | Given | When | Then | Test Type |
|-------|-----------|-------|------|------|-----------|
| AC-1 | US-1 | Valid credentials (from .env) | When the user submits the login form | Then a session cookie is set and the user is redirected to /chat | Integration |
| AC-2 | US-1 | Invalid credentials | When the user submits the login form | Then an error message is displayed, no redirect | Unit |
| AC-3 | US-1 | No session cookie | When the user navigates to /chat | Then they are redirected to /login | Unit |
| AC-4 | US-2 | A logged-in user | When they submit a question | Then the question appears as a user message bubble and the answer appears as an assistant bubble | E2E |
| AC-5 | US-3 | An answer with citations | When the answer is displayed | Then citation links are shown with article title, section, and clickable URL | Unit |
| AC-6 | US-4 | A logged-in user | When they click logout | Then the session cookie is destroyed and they are redirected to /login | Integration |
| AC-7 | US-5 | A user submits a question | When the answer is loading | Then a loading indicator is visible and the input is disabled | Unit |
| AC-8 | US-1 | A valid session cookie | When `verifySession()` is called | Then it returns the session payload without error | Unit |
| AC-9 | US-1 | An expired or tampered session cookie | When `verifySession()` is called | Then it returns null / throws, and the user is redirected to login | Unit |

## 6. Blast Radius

### Components Affected

| Component | Impact | Risk Level |
|-----------|--------|------------|
| `apps/web/lib/auth.ts` | Direct — session management | High |
| `apps/web/components/login-form.tsx` | Direct — login UI | Med |
| `apps/web/components/chat-box.tsx` | Direct — chat UI | Med |
| `apps/web/components/chat-message.tsx` | Direct — message rendering | Low |
| `apps/web/components/citation-list.tsx` | Direct — citation display | Low |
| `apps/web/app/login/page.tsx` | Direct — login page | Low |
| `apps/web/app/chat/page.tsx` | Direct — chat page with auth guard | Low |
| `apps/web/app/api/auth/*/route.ts` | Direct — auth API routes | Med |
| `apps/web/app/api/chat/route.ts` | Indirect — checks auth before processing | Low |

### Data Impact

- **Database changes**: None — auth uses JWT cookies, no database tables
- **Existing data**: No impact
- **Rollback complexity**: Simple — components are independent

## 7. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|-------------|-------------|------------------|
| Storing JWT in localStorage | XSS vulnerable — JS can read it | HttpOnly cookie — JS can't access |
| Using Edge Runtime with auth | jose works in Edge, but TypeORM (used in other routes) doesn't | Use Node.js runtime consistently |
| Making all components client components | Unnecessary bundle size, slower initial load | Server components by default; `'use client'` only for interactive parts |
| Hardcoding credentials in source code | Security leak if repo is public | Credentials in `.env`, loaded via `process.env` |
| Using `dangerouslySetInnerHTML` for LLM output | XSS risk if LLM output contains malicious HTML | Use `react-markdown` for safe rendering |

## 8. Constraints

| Constraint | Source | Implication |
|-----------|--------|-------------|
| Demo-grade auth (hardcoded credentials in .env) | Challenge rules ("simple is fine, even hardcoded") | No user registration, no password hashing needed |
| Must work behind Nginx reverse proxy | Deployment architecture | Cookie path, Secure flag, proxy headers must be correct |
| Evaluator needs credentials in submission email | Challenge rules | Credentials must be in `.env.example` for documentation |
| Next.js App Router (not Pages Router) | Project convention | Server components, route handlers, middleware patterns |

## 9. Security Requirements

| Requirement | Priority | Implementation |
|------------|----------|----------------|
| HttpOnly session cookies | Must | `jose` JWT in HttpOnly cookie, not accessible via JS |
| Session expiry (24h) | Must | JWT `exp` claim set to 24 hours |
| Auth check on every /chat and /api/chat request | Must | Server-side session verification |
| Credentials not in source code | Must | `.env` variables, `.env.example` shows structure only |
| CSRF protection | Should | SameSite cookie attribute |
| Secure cookie flag in production (HTTPS) | Must | Set `Secure: true` when served via HTTPS |

### Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|------------|
| Session hijacking | Stolen cookies | HttpOnly + Secure + SameSite flags |
| Brute-force login | Automated credential guessing | Simple hardcoded credentials; no rate limit needed for demo |
| XSS via LLM output | LLM generates HTML/script in answer | Use `react-markdown` (sanitizes by default), not `dangerouslySetInnerHTML` |
| CSRF | Cross-origin form submission | SameSite=Lax cookie policy |

## 10. Out of Scope

- User registration / sign-up
- Password hashing (demo credentials only)
- Multi-user session management
- Chat history persistence across sessions
- Dark mode / theme switching
- Mobile-specific responsive design
- Accessibility (WCAG) compliance

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cookie not set behind Nginx proxy | Med | High | Verify proxy_pass headers, test in Docker |
| Session expiry during evaluation | Low | Med | 24h expiry is generous for demo |
| LLM output with special characters breaks rendering | Low | Med | Use react-markdown for safe rendering |
| Login redirect loop | Low | High | Test auth flow end-to-end in integration test |

## 12. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Login success with valid credentials | 100% | E2E test |
| Unauthorized access blocked | 100% | E2E test |
| Chat round-trip works | Question → Answer displayed | E2E test |
| Citations displayed | Every answer shows source links | Visual verification + unit test |
| Test coverage | >= 80% on auth + components | Jest coverage report |

## 13. Open Questions

- [ ] Should we add react-markdown rendering for LLM output? — Yes, as a task within this feature
- [ ] Should we add chat history persistence to database? — No, out of scope for v1
- [x] Is 24h session expiry appropriate? — Yes, evaluators won't need longer sessions

---

## Sign-off

- [ ] Stakeholder review complete
- [ ] AC agreed upon
- [ ] Ready for Phase 2 (Design)
