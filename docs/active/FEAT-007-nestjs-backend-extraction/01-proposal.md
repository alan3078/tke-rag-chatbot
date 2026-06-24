# Phase 1: Proposal — Extract Backend to NestJS

> **Status**: PROPOSAL (RESOLVED)
> **Author**: Alan Yiu
> **Date**: 2026-06-24
> **Feature ID**: FEAT-007

---

## 1. Problem Statement

The current architecture couples all server-side logic (RAG pipeline, auth, database, LLM calls, embeddings) inside the Next.js monolith under `apps/web/`. Next.js API routes serve double duty as both frontend framework and backend API, making the system harder to scale, test, and deploy independently. The RAG pipeline is a CPU/memory-heavy workload that should not share resources with the UI server. A separate NestJS backend provides clean separation of concerns, independent scaling, and a proper REST API contract. **The goal is a 100% clean split**: Next.js is pure frontend (static/CSR only, zero server deps), NestJS owns everything backend. No leftover server code, no duplicated logic, no Next.js middleware or route handlers importing TypeORM/jose/pg.**

## 2. Business Requirements

| # | Requirement | Priority | Rationale |
|---|-------------|----------|-----------|
| BR-1 | All existing API routes (`/api/auth/*`, `/api/chat`) must work identically from the frontend perspective | Must | Zero regression for end users |
| BR-2 | NestJS backend must run as a separate Docker service with its own process | Must | Independent scaling and resource isolation |
| BR-3 | Next.js must be a pure frontend — zero server-side runtime deps (no TypeORM, jose, pg, pgvector, openai, nodejieba, dotenv) | Must | Clean separation; no ambiguity about where logic lives |
| BR-4 | Database access (TypeORM, entities, migrations) must be fully removed from Next.js and live in NestJS only | Must | Single source of truth for data access |
| BR-5 | Authentication (JWT session cookies) must be handled entirely by NestJS | Must | No JWT verification code in Next.js |
| BR-6 | The RAG pipeline, LLM calls, and embedding generation must live in NestJS | Must | Backend handles all AI workloads |
| BR-7 | Ingestion scripts (`crawl.ts`, `ingest.ts`, `check-coverage.ts`) must live in the NestJS project | Must | Scripts import entities and lib from the backend; no cross-app imports |
| BR-8 | Docker Compose must orchestrate 4 services: nginx, backend (NestJS), frontend (Next.js static), postgres | Must | Production-ready multi-service deployment |
| BR-9 | Page-level route protection (/chat) must work via API call to backend, not server-side JWT checks | Must | Zero server-side auth logic in Next.js |
| BR-10 | NestJS must expose a Swagger/OpenAPI spec at `/api/docs` | Should | API documentation for future clients |
| BR-11 | Frontend shared types (ChatMessage, Citation, etc.) must be co-located with frontend code, maintained manually, NOT imported from backend | Must | Avoids runtime dependency on backend; types are a contract, not code |

## 3. Stakeholder Analysis

| Stakeholder | Role | Concern | How We Address It |
|-------------|------|---------|-------------------|
| End User | Uses the chat UI | Must not notice any difference | API contract preserved; same routes proxied through nginx |
| Evaluator | Grades correctness | Correctness must not regress | All existing RAG tests migrate to backend; E2E smoke tests |
| Developer | Maintains the code | Clean, unambiguous architecture | NestJS modules mirror current `lib/` structure; Swagger docs; no leftover code in Next.js |
| Ops / Deploy | Runs the server | Multi-service deployment must be simple | Single `docker compose up` with health checks and depends_on |

## 4. User Stories

```
As a developer,
I want the backend to run as a separate NestJS service,
so that I can deploy, scale, and debug it independently from the frontend.

As a user,
I want the chat to work exactly as before,
so that I can continue asking questions about 清华大学软件学院 without interruption.

As an ops engineer,
I want a single docker compose up to start everything,
so that deployment remains as simple as the current monolith.

As a developer,
I want to look at the Next.js project and see ZERO backend code,
so that I never wonder where a certain piece of logic belongs.
```

- US-1: As a developer, I want ALL server-side logic (auth, RAG, DB, LLM, embeddings, scripts) moved to a NestJS backend so that the Next.js app is a pure frontend with zero server deps.
- US-2: As a user, I want authentication (login/logout) to work seamlessly via the frontend talking to the NestJS backend.
- US-3: As a user, I want RAG chat queries to return answers with citations identically to the current system.
- US-4: As an ops engineer, I want `docker compose up` to start all 4 services with nginx routing.
- US-5: As a developer, I want Swagger API docs available at `/api/docs`.
- US-6: As a developer, I want to run ingestion scripts (`crawl`, `ingest`) from the backend project without cross-app imports.

## 5. Acceptance Criteria (AC)

Each AC maps to a user story and is verifiable with a test.

| AC ID | User Story | Given | When | Then | Test Type |
|-------|-----------|-------|------|------|-----------|
| AC-1 | US-1 | The project is running with Docker Compose | A request hits Nginx at port 8443 | Next.js serves the UI; NestJS handles all `/api/*` requests; no request reaches a Next.js route handler | Integration |
| AC-2 | US-1 | The Next.js app at `apps/web/` is inspected | We search for server-only deps (typeorm, pg, pgvector, jose, openai, nodejieba, dotenv) in `package.json` | None of these dependencies are listed; `npm run build` succeeds without `serverExternalPackages` | Unit |
| AC-3 | US-1 | The Next.js app at `apps/web/app/api/` is inspected | We check for route handler files | The `api/` directory does NOT exist; no `route.ts` files remain | Unit |
| AC-4 | US-1 | The Next.js app at `apps/web/lib/` is inspected | We check for server-side logic modules (auth.ts, db.ts, rag.ts, retrieval.ts, etc.) | These files do NOT exist; only `api-client.ts` remains as the frontend HTTP client | Unit |
| AC-5 | US-1 | The Next.js app at `apps/web/entities/` is inspected | We check for TypeORM entity files | The `entities/` directory does NOT exist | Unit |
| AC-6 | US-2 | A user navigates to `/login` | They submit valid credentials | NestJS validates credentials, creates a session cookie, returns success; frontend redirects to `/chat` | E2E |
| AC-7 | US-2 | A user has no valid session | They navigate to `/chat` | Frontend calls `GET /api/auth/session` to NestJS; returns 401; frontend redirects to `/login` | E2E |
| AC-8 | US-3 | A logged-in user asks "软件学院有哪些专业？" | The chat API is called | NestJS runs RAG pipeline and returns `{ answer: string, citations: Citation[] }` with verifiable citations | Integration |
| AC-9 | US-3 | The RAG pipeline runs in NestJS | Query → embedding → hybrid search → LLM answer | The output format matches the current system's response structure exactly | Unit |
| AC-10 | US-4 | The server is freshly booted | `docker compose up -d --build` is run | All 4 services (nginx, backend, frontend, postgres) start healthy | Integration |
| AC-11 | US-4 | Backend container crashes | Docker Compose is running | Backend restarts automatically; session cookies from before crash remain valid | Integration |
| AC-12 | US-5 | NestJS backend is running | Developer navigates to `https://host:8443/api/docs` | Swagger UI displays all API endpoints with request/response schemas | E2E |
| AC-13 | US-6 | Developer runs `npm run crawl` from the backend project | The command executes | Crawler runs and inserts articles into the database via backend's TypeORM DataSource | Integration |
| AC-14 | US-6 | Developer runs `npm run ingest` from the backend project | The command executes | Ingestion pipeline chunks + embeds + stores 100% of crawled articles | Integration |

## 6. Blast Radius

_What parts of the system does this feature touch? What could break?_

### Components Affected

| Component | Impact | Risk Level |
|-----------|--------|------------|
| `apps/web/lib/*` (all 11 source files) | **DELETED** — code fully migrated to NestJS backend | High |
| `apps/web/app/api/*` (all 3 route files) | **DELETED** — entire `api/` directory removed | High |
| `apps/web/entities/*` | **DELETED** from Next.js; **MOVED** to backend | High |
| `apps/web/migrations/` | **DELETED** from Next.js; **MOVED** to backend | Medium |
| `apps/web/package.json` | **Modified** — remove deps: typeorm, pg, pgvector, jose, openai, nodejieba, reflect-metadata, dotenv | Medium |
| `apps/web/types/index.ts` | **Modified** — keep only frontend-facing types (ChatMessage, Citation, etc. as plain type definitions); remove entity imports | Low |
| `apps/web/lib/api-client.ts` | **Modified** — update for new backend API contract | Low |
| `apps/web/components/chat-box.tsx` | **Modified** — API client signature may change | Low |
| `apps/web/components/login-form.tsx` | **Modified** — API client signature may change | Low |
| `apps/web/app/page.tsx` | **Modified** — remove server-side session check; add client-side auth guard | Medium |
| `apps/web/app/chat/page.tsx` | **Modified** — remove server-side session check; add client-side auth guard | Medium |
| `apps/web/app/login/page.tsx` | **Modified** — remove server-side session check | Low |
| `next.config.ts` | **Modified** — remove `serverExternalPackages`, `output: "standalone"` | Low |
| `Dockerfile` | **REPLACED** by two: `Dockerfile.backend` (NestJS) + `Dockerfile.frontend` (Next.js static) | High |
| `docker-compose.yml` | **Modified** — replace `app` with `backend` + `frontend` services; update depends_on | Medium |
| `nginx.conf` | **Modified** — proxy `/api/*` to `backend:3001`, rest to `frontend:3000` | Low |
| `scripts/*.ts` | **MOVED** to `apps/backend/scripts/` | Medium |
| Root `package.json` | **Modified** — update workspace scripts (dev, crawl, ingest, build commands) | Low |
| Root `tsconfig.json` | **May be modified** — if backend needs different paths | Low |

### Data Impact

- **Database changes**: None — same PostgreSQL schema, same migrations (just moved)
- **Existing data**: Preserved — no data migration required
- **Rollback complexity**: Difficult — requires restoring deleted files and reversing package.json changes; database is unaffected but git revert is the recommended rollback

## 7. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|-------------|-------------|------------------|
| Duplicating `lib/` code in both frontend and backend | Two sources of truth, inevitable divergence | Backend is the ONLY source of truth; frontend has a thin API client only |
| Keeping Next.js API routes as passthrough proxies | Defeats the purpose of extraction; adds unnecessary hop | Nginx routes `/api/*` directly to NestJS backend |
| Keeping any server dep (typeorm, jose, pg, etc.) in apps/web/package.json | Ambiguous: "is this still a server app or not?" | ALL server deps removed; frontend has only react, tailwind, tanstack, zod |
| Keeping entities/ in Next.js "just in case" | Leftover confusion about where data models live | Entities live ONLY in backend |
| NestJS backend calling Next.js for anything | Creates circular dependency | Backend is fully independent; frontend consumes backend API |
| Hardcoding backend URL in frontend code | Breaks in different environments | Use relative `/api/*` paths; nginx proxy handles routing |
| Using Next.js middleware or server components to check auth | Defeats the clean split; requires jose/TypeORM in frontend | Auth check via fetch to `GET /api/auth/session` from client-side auth guard |
| Using `synchronize: true` in NestJS TypeORM | Data loss risk in production | Keep `synchronize: false`; use migrations as before |

## 8. Constraints

| Constraint | Source | Implication |
|-----------|--------|-------------|
| Must work with same PostgreSQL instance | Infra | Backend connects to same `postgres` service, same `DATABASE_URL` |
| LLM API (OpenRouter) must be accessible from Beijing server | Infra | NestJS backend runs on the same server, same network; no change |
| Embedding model (Ollama) runs locally for ingestion only | Infra | Ingestion scripts run on dev machine; backend only needs LLM API at runtime |
| Nginx must terminate SSL on port 8443 | Infra | Nginx remains the single entry point; backend never exposed directly |
| TypeScript strict mode | Dev | NestJS project uses strict TS, follows same naming conventions |
| Next.js must NOT import anything from the backend project | Architecture | Frontend and backend are completely decoupled; only HTTP API between them |

## 9. Security Requirements

| Requirement | Priority | Implementation |
|------------|----------|----------------|
| Session cookies must remain HttpOnly, Secure, SameSite=Lax | Must | NestJS sets cookies with same attributes as current `auth.ts` |
| CORS must be restricted to the frontend origin | Must | NestJS CORS config for cookie-based auth (origin, credentials) |
| API rate limiting on `/api/chat` | Should | NestJS `@nestjs/throttler` — 10 req/min per IP |
| Input validation on all endpoints | Must | NestJS `ValidationPipe` + DTOs with `class-validator` decorators |
| `.env` secrets must not be bundled in Docker images | Must | Passed at runtime via `env_file` in docker-compose |
| Frontend must never see JWT secret or DB credentials | Must | No env vars prefixed with `NEXT_PUBLIC_` expose secrets |

### Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|------------|
| Direct backend access bypassing nginx | Attacker probes port 3001 | Backend port not exposed in docker-compose; only nginx can reach it |
| Session hijacking | XSS steals JWT cookie | HttpOnly cookie; no JS access to session token |
| LLM prompt injection | Malicious query in chat | System prompt already constrains answers to indexed content; input sanitization |

## 10. Out of Scope

_Explicitly list what this feature does NOT cover._

- Frontend design changes or new UI features
- Database schema changes or new entity types
- Changes to the RAG algorithm (hybrid search, chunking, LLM prompt)
- Changes to the crawler logic itself (only moved, not rewritten)
- CI/CD pipeline setup
- Monitoring, logging aggregation, or observability (beyond basic NestJS logger)
- Kubernetes or multi-host deployment
- Mobile app or third-party client support (beyond having a clean API)
- E2E test suite creation (beyond what already exists)

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| TypeORM + pgvector compatibility with NestJS | Low | High | NestJS has first-class TypeORM support (`@nestjs/typeorm`); pgvector is a raw SQL extension unaffected by ORM framework |
| Session cookie domain/port mismatch between services | Medium | High | Nginx reverse proxy makes both services appear on same origin; cookies set with `path=/` |
| Build performance regression with two Dockerfiles | Medium | Low | Build stages are parallelized; Docker Compose builds services independently |
| Client-side auth guard causes flash of unprotected content | Medium | Medium | Implement loading skeleton + redirect in client-side auth wrapper component; acceptable UX tradeoff |
| Next.js app build failing after removing server deps | Medium | Medium | Any remaining server imports will cause build failure — grep for them before deleting; easily caught in CI |
| `nodejieba` native module in NestJS Docker image | Medium | Medium | Same Alpine/node setup as current Dockerfile; `nodejieba` already works in containerized Node.js |
| Ingestion scripts break due to import path changes | Medium | Medium | All scripts move into `apps/backend/scripts/` and import from local `src/`; no cross-app paths |

## 12. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| API route parity | 100% of existing routes work | Manual test: login, logout, chat with known query |
| Frontend build without server deps | `npm run build` succeeds in `apps/web/` | No `serverExternalPackages`; zero server deps in package.json |
| RAG answer quality | Identical to pre-extraction for 10 evaluation questions | Run evaluation set; compare answers |
| Docker Compose startup time | < 60 seconds from `docker compose up -d` to all healthy | `docker compose ps` showing all "healthy" |
| Test coverage (new code) | >= 60% for NestJS services | `npm test -- --coverage` in backend directory |
| Files remaining in apps/web/lib/ | Only `api-client.ts` | `ls apps/web/lib/` returns exactly 1 file |

## 13. Open Questions — RESOLVED

| # | Question | Resolution | Rationale |
|---|----------|------------|-----------|
| Q1 | Should entities be copied or extracted to a shared package? | **Moved to backend only.** Entities live exclusively in `apps/backend/src/entities/`. Next.js does NOT have entities. | Clean separation; no "shared" package complexity; frontend types are standalone. |
| Q2 | How should frontend protect routes without server-side JWT? | **Client-side auth guard component** that calls `GET /api/auth/session` on mount; shows loading skeleton then redirects to `/login` on 401. Zero Next.js server code. | No jose or TypeORM in frontend; pure API-based auth check. |
| Q3 | What port should NestJS use? | **3001** (Next.js stays on 3000). | Clear convention; matches nginx proxy config. |
| Q4 | Should Next.js keep `output: "standalone"`? | **Remove it.** Next.js builds as standard static export or uses `next start` in Docker. | Standalone mode was for the monolith; pure frontend doesn't need it. |
| Q5 | Where should ingestion scripts live? | **In `apps/backend/scripts/`**, importing from backend's `src/`. | Scripts are backend operations; they import entities and lib from the same project. |
| Q6 | Should frontend use auto-generated types from OpenAPI? | **No.** Manually maintained types in `apps/web/types/`. | Avoids codegen complexity; the API is small and stable; types act as a contract document. |

---

## Sign-off

- [ ] Stakeholder review complete
- [ ] AC agreed upon
- [ ] Ready for Phase 2 (Design)
