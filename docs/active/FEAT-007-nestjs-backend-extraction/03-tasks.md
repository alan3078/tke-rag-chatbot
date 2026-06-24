# Phase 3: Task Breakdown — Extract Backend to NestJS

> **Status**: IN PROGRESS
> **Design**: [02-design.md](./02-design.md)
> **Author**: Alan Yiu
> **Date**: 2026-06-24
> **Feature ID**: FEAT-007

---

## TDD Workflow Reminder

Every implementation task follows **Red-Green-Refactor**:

1. **Red** — Write a failing test that defines the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up while keeping tests green

T-even numbers = RED (write failing test). T-odd numbers = GREEN (implement to pass). Refactor after logical groups.

---

## Task List

Tasks are ordered by dependency chain.

### Group A: NestJS Project Scaffold

- [ ] **T-001** | RED | Write failing build test for NestJS project
  - AC: N/A (enabler)
  - Effort: S
  - Test: `apps/backend/__tests__/unit/app.module.spec.ts` — verifies AppModule compiles
  - Details: Create test that imports AppModule and verifies it can be compiled by `Test.createTestingModule()`

- [ ] **T-002** | GREEN | Scaffold NestJS project structure
  - AC: N/A (enabler)
  - Effort: M
  - Files: `apps/backend/package.json`, `apps/backend/tsconfig.json`, `apps/backend/nest-cli.json`, `apps/backend/src/main.ts`, `apps/backend/src/app.module.ts`
  - Details: `nest new` equivalent setup. Install deps: @nestjs/core, @nestjs/common, @nestjs/platform-express, @nestjs/testing, class-validator, class-transformer, cookie-parser. Configure tsconfig strict. Configure npm scripts: `build`, `start:dev`, `start:prod`, `test`, `test:e2e`. Bootstrap m with ValidationPipe in `main.ts`. Verify `npm run build` passes.

### Group B: Database Module (TypeORM + Entities + Migrations)

- [ ] **T-003** | RED | Write failing test for DatabaseModule
  - AC: AC-2 (server deps moved to backend)
  - Effort: S
  - Test: `apps/backend/__tests__/unit/database.module.spec.ts` — verifies TypeOrmModule.forRootAsync() compiles with entities [Article, Chunk]
  - Details: Testing module imports DatabaseModule; verify TypeOrmCoreModule is available

- [ ] **T-004** | GREEN | Implement DatabaseModule + move entities + move migrations
  - AC: AC-2, AC-4, AC-5
  - Effort: M
  - Files: `apps/backend/src/database/database.module.ts`, `apps/backend/src/database/data-source.ts`, `apps/backend/src/entities/*.ts`, `apps/backend/src/migrations/*.ts`, `apps/backend/src/common/constants.ts`
  - Details: Copy entities from `apps/web/entities/` → `apps/backend/src/entities/`. Copy all 4 migrations. Copy `constants.ts` (ChunkLevel, MessageRole enums). Create `DatabaseModule` with `TypeOrmModule.forRootAsync()` reading `DATABASE_URL` from env. Create `data-source.ts` for CLI. Verify test passes.

- [ ] **T-005** | REFACTOR | Clean up database module
  - AC: All
  - Effort: S
  - Details: Verify all entity decorators are consistent. Ensure entities are properly exported from barrel `index.ts`. Check that `synchronize: false` is set. Add `run-migrations.ts` script.

### Group C: Auth Module

- [ ] **T-006** | RED | Write failing tests for AuthModule
  - AC: AC-6, AC-7
  - Effort: S
  - Test: `apps/backend/__tests__/unit/auth.service.spec.ts` — test `validateCredentials()` returns true/false; test `createSession()` returns JWT string; test `verifySession()` returns username or null
  - Details: Mock env vars (AUTH_USERNAME, AUTH_PASSWORD, AUTH_SECRET). Test login success/failure. Test session creation and verification.

- [ ] **T-007** | GREEN | Implement Auth module (service + controller + guard)
  - AC: AC-6, AC-7
  - Effort: M
  - Files: `apps/backend/src/auth/auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.guard.ts`, `auth.constants.ts`, `dto/login.dto.ts`, `dto/session-response.dto.ts`
  - Details: Port `apps/web/lib/auth.ts` logic into NestJS service. `AuthService.validateCredentials(username, password)` → checks env vars. `AuthService.createSession(username)` → signs JWT with jose, returns token string. `AuthService.verifySession(token)` → jose.verify, returns username or null. `AuthController`: POST /auth/login, POST /auth/logout, GET /auth/session. Use `@Res()` to set/clear cookies manually. `AuthGuard` implements `CanActivate` — reads cookie, calls verifySession, attaches username to request.

- [ ] **T-008** | RED | Write failing E2E tests for Auth API
  - AC: AC-6, AC-7
  - Effort: M
  - Test: `apps/backend/__tests__/e2e/auth.e2e-spec.ts` — supertest tests for login/logout/session
  - Details: POST /auth/login with valid credentials → 200 + Set-Cookie. POST /auth/login with invalid credentials → 401. GET /auth/session with valid cookie → {authenticated: true}. GET /auth/session without cookie → {authenticated: false}. POST /auth/logout → clears cookie.

- [ ] **T-009** | GREEN | Implement cookie handling + wire E2E tests
  - AC: AC-6, AC-7
  - Effort: S
  - Details: Add cookie-parser to main.ts bootstrap. Configure CORS with credentials. Implement `@Res({ passthrough: true })` response handling for cookie set/clear. Run E2E tests → all pass.

- [ ] **T-010** | REFACTOR | Auth module cleanup
  - AC: AC-6, AC-7
  - Effort: S
  - Details: Extract cookie constants (COOKIE_NAME, SESSION_TTL) to `auth.constants.ts`. Ensure error messages match current system. Add logging.

### Group D: Embeddings Module

- [ ] **T-011** | RED | Write failing test for EmbeddingsService
  - AC: AC-9
  - Effort: S
  - Test: `apps/backend/__tests__/unit/embeddings.service.spec.ts` — mock Ollama /api/embed response; test `generateQueryEmbedding()` returns 1024-dim vector; test `generateEmbeddings()` returns batch correctly
  - Details: Test returns correct dimensions (1024). Test batch splitting. Test error handling when Ollama is down.

- [ ] **T-012** | GREEN | Implement EmbeddingsService
  - AC: AC-9
  - Effort: S
  - Files: `apps/backend/src/embeddings/embeddings.module.ts`, `embeddings.service.ts`, `embeddings.constants.ts`
  - Details: Port `apps/web/lib/embeddings.ts` into NestJS `@Injectable()` service. Same logic: call Ollama /api/embed, batch size 32, return number[][].

- [ ] **T-013** | REFACTOR | Embeddings module cleanup
  - AC: AC-9
  - Effort: S
  - Details: Move all magic numbers to `embeddings.constants.ts`. Ensure env vars are read with defaults.

### Group E: LLM Module

- [ ] **T-014** | RED | Write failing test for LlmService
  - AC: AC-9
  - Effort: S
  - Test: `apps/backend/__tests__/unit/llm.service.spec.ts` — mock OpenAI SDK; test `generateAnswer()` returns string; test system prompt is included; test context is included in prompt
  - Details: Mock `openai.chat.completions.create()`. Verify response format. Test error handling.

- [ ] **T-015** | GREEN | Implement LlmService
  - AC: AC-9
  - Effort: S
  - Files: `apps/backend/src/llm/llm.module.ts`, `llm.service.ts`, `llm.constants.ts`
  - Details: Port `apps/web/lib/llm.ts` into NestJS service. Same logic: OpenRouter → DeepSeek V4 Pro, temperature 0.3, max_tokens 2000. Same system prompt. `generateAnswer()` returns string. `generateAnswerStream()` returns ReadableStream (nice to have — can skip initially).

- [ ] **T-016** | REFACTOR | LLM module cleanup
  - AC: AC-9
  - Effort: S
  - Details: Move all magic numbers to `llm.constants.ts`. Ensure env vars with defaults.

### Group F: Segmentation Module

- [ ] **T-017** | RED | Write failing test for SegmentationService
  - AC: AC-9
  - Effort: S
  - Test: `apps/backend/__tests__/unit/segmentation.service.spec.ts` — test Chinese text gets segmented; test English text preserved; test mixed text handled
  - Details: Verify `nodejieba.cut()` is called on CJK runs. Verify non-CJK preserved.

- [ ] **T-018** | GREEN | Implement SegmentationService
  - AC: AC-9
  - Effort: S
  - Files: `apps/backend/src/segmentation/segmentation.module.ts`, `segmentation.service.ts`, `segmentation.constants.ts`
  - Details: Port `apps/web/lib/segmentation.ts` into NestJS service. Same logic with `nodejieba`.

- [ ] **T-019** | REFACTOR | Segmentation module cleanup
  - AC: AC-9
  - Effort: S
  - Details: Ensure CJK regex patterns in constants.

### Group G: Chunking Module

- [ ] **T-020** | RED | Write failing test for ChunkingService
  - AC: AC-9 (RAG pipeline components work)
  - Effort: S
  - Test: `apps/backend/__tests__/unit/chunking.service.spec.ts` — test L1 chunk always created (level=1, truncated at 2000 chars); test L2 chunks for long text (level=2, 600-900 chars); test metadata prefix format; test short text (< 800 chars) produces only L1
  - Details: Verify chunk shape: `{ chunkIndex, level, content, tokenCount }`. Verify metadata prefix: `标题：...\n日期：...\n栏目：...\n正文：\n`.

- [ ] **T-021** | GREEN | Implement ChunkingService
  - AC: AC-9
  - Effort: S
  - Files: `apps/backend/src/chunking/chunking.module.ts`, `chunking.service.ts`, `chunking.constants.ts`
  - Details: Port `apps/web/lib/chunking.ts` into NestJS service. Same logic: hierarchical L1/L2 chunking, paragraph → sentence splitting, overlap.

- [ ] **T-022** | REFACTOR | Chunking module cleanup
  - AC: AC-9
  - Effort: S
  - Details: Move target sizes, overlap, truncation limits to constants.

### Group H: Retrieval Module

- [ ] **T-023** | RED | Write failing test for RetrievalService
  - AC: AC-9
  - Effort: M
  - Test: `apps/backend/__tests__/unit/retrieval.service.spec.ts` — mock DataSource.query(); test `hybridSearch()` calls all 4 SQL queries; test RRF merge calculation; test L1 boost application; test result sorting; test `formatContext()` output format
  - Details: Mock L1 vector results, L2 vector results, L2 keyword results. Verify RRF formula: `0.6/(60+rank) + 0.4/(60+rank)`. Verify L1 boost multiplies by 1.3. Verify final top-K sorting.

- [ ] **T-024** | GREEN | Implement RetrievalService
  - AC: AC-9
  - Effort: M
  - Files: `apps/backend/src/retrieval/retrieval.module.ts`, `retrieval.service.ts`, `retrieval.constants.ts`
  - Details: Port `apps/web/lib/retrieval.ts` into NestJS service. Same logic: `hybridSearch(query, limit?)` → multi-level search + RRF + L1 boost. `formatContext(results)` → formatted context string. Use `@InjectDataSource()` to get DataSource.

- [ ] **T-025** | REFACTOR | Retrieval module cleanup
  - AC: AC-9
  - Effort: S
  - Details: Move RRF_K, weights, L1_BOOST, TOP_K values to constants. Ensure SQL uses `pgvector.toSql()` for embedding params.

### Group I: Chat Module (RAG Pipeline Orchestrator)

- [ ] **T-026** | RED | Write failing test for ChatService
  - AC: AC-8, AC-9
  - Effort: M
  - Test: `apps/backend/__tests__/unit/chat.service.spec.ts` — mock all dependencies (RetrievalService, EmbeddingsService, LlmService); test `ragQuery()` orchestration flow; test citation deduplication by URL; test fallback response when no results; test output matches `{ answer, citations }` shape
  - Details: Verify calls in order: `generateQueryEmbedding()` → `hybridSearch()` → `formatContext()` → `generateAnswer()`. Verify citations deduplicated by URL. Verify fallback to `"抱歉，我在已索引的网站内容中找不到..."`.

- [ ] **T-027** | GREEN | Implement ChatService + ChatController
  - AC: AC-8, AC-9
  - Effort: M
  - Files: `apps/backend/src/chat/chat.module.ts`, `chat.service.ts`, `chat.controller.ts`, `chat.constants.ts`, `dto/chat-request.dto.ts`, `dto/chat-response.dto.ts`
  - Details: Port `apps/web/lib/rag.ts` into NestJS `ChatService.ragQuery()`. Create `ChatController` with `@Post('chat')` guarded by `@UseGuards(AuthGuard)`. DTO validation: message must be non-empty string, history must be array. Same system prompt, same fallback response.

- [ ] **T-028** | RED | Write failing E2E test for Chat API
  - AC: AC-8
  - Effort: L
  - Test: `apps/backend/__tests__/e2e/chat.e2e-spec.ts` — supertest tests with actual database + mock LLM
  - Details: POST /chat with valid session → 200 + {answer, citations}. POST /chat without session → 401. POST /chat with empty message → 400. Verify citation structure matches existing format.

- [ ] **T-029** | GREEN | Wire Chat E2E tests
  - AC: AC-8
  - Effort: S
  - Details: Add test database setup. Configure supertest to use NestJS app. Run E2E tests → all pass.

- [ ] **T-030** | REFACTOR | Chat module cleanup
  - AC: AC-8, AC-9
  - Effort: S
  - Details: Move system prompt to constants. Extract citation deduplication into helper. Ensure error codes match design.

### Group J: Swagger & Rate Limiting

- [ ] **T-031** | RED | Write failing test for Swagger docs endpoint
  - AC: AC-12
  - Effort: S
  - Test: `apps/backend/__tests__/e2e/swagger.e2e-spec.ts` — supertest GET /api/docs → 200 with swagger-ui HTML
  - Details: Verify response contains "swagger" HTML. Verify all endpoints are listed in /api-json.

- [ ] **T-032** | GREEN | Implement Swagger + Throttler
  - AC: AC-12
  - Effort: S
  - Files: `apps/backend/src/main.ts` (swagger setup)
  - Details: Add `@nestjs/swagger` setup in main.ts: `SwaggerModule.setup('api/docs', app, document)`. Add `@ApiTags`, `@ApiOperation`, `@ApiBody`, `@ApiResponse` decorators to all controllers. Add `@nestjs/throttler` with guard applied to /chat endpoint (10 req/min).

- [ ] **T-033** | REFACTOR | Swagger + validation cleanup
  - AC: AC-12
  - Effort: S
  - Details: Ensure all DTOs have `@ApiProperty()` decorators. Verify ValidationPipe with `whitelist: true, forbidNonWhitelisted: true`.

### Group K: Scripts Migration

- [ ] **T-034** | RED | Write failing test for scripts migration
  - AC: AC-13, AC-14
  - Effort: M
  - Test: `apps/backend/__tests__/integration/scripts.spec.ts` — verify crawl.ts and ingest.ts import from backend src/ without errors; test crawl inserts articles; test ingest creates chunks with embeddings
  - Details: Import crawl and ingest functions. Mock database. Verify they produce expected output.

- [ ] **T-035** | GREEN | Move scripts to backend + update imports
  - AC: AC-13, AC-14
  - Effort: M
  - Files: `apps/backend/scripts/crawl.ts`, `apps/backend/scripts/ingest.ts`, `apps/backend/scripts/check-coverage.ts`
  - Details: Move `scripts/*.ts` from monorepo root → `apps/backend/scripts/`. Update all import paths: `../apps/web/entities/` → `../src/entities/`, `../apps/web/lib/` → `../src/` services. Update `apps/backend/package.json` scripts: `"crawl": "npx tsx scripts/crawl.ts"`, etc.

- [ ] **T-036** | REFACTOR | Scripts cleanup
  - AC: AC-13, AC-14
  - Effort: S
  - Details: Add `cheerio` dep to backend package.json. Verify scripts run standalone. Ensure `reflect-metadata` is imported at top of each script entry.

### Group L: Next.js Frontend Cleanup

- [ ] **T-037** | RED | Write failing test (build check) for clean frontend
  - AC: AC-2, AC-3, AC-4, AC-5
  - Effort: S
  - Test: Shell script / CI check — `grep` for server deps in package.json; `ls` for api/, entities/, lib/ files; `npm run build` in apps/web/
  - Details: Verify `apps/web/package.json` has NO mention of typeorm, pg, pgvector, jose, openai, nodejieba, reflect-metadata, dotenv. Verify `apps/web/app/api/` does not exist. Verify `apps/web/lib/` contains only `api-client.ts`. Verify `apps/web/entities/` does not exist.

- [ ] **T-038** | GREEN | Delete server code from Next.js
  - AC: AC-2, AC-3, AC-4, AC-5
  - Effort: M
  - Details: Delete `apps/web/app/api/` (entire directory). Delete `apps/web/lib/auth.ts`, `db.ts`, `data-source.ts`, `rag.ts`, `retrieval.ts`, `embeddings.ts`, `llm.ts`, `chunking.ts`, `segmentation.ts`, `constants.ts`, `date-utils.ts`, `server-env.ts`, `run-migrations.ts`. Delete `apps/web/entities/` (entire directory). Delete `apps/web/migrations/` (entire directory). Remove from `apps/web/package.json`: typeorm, pg, pgvector, jose, openai, nodejieba, reflect-metadata, dotenv, cheerio. Remove from `next.config.ts`: `serverExternalPackages`, `output: "standalone"`. Run `npm install` in apps/web/.

- [ ] **T-039** | REFACTOR | Frontend build verification
  - AC: AC-2
  - Effort: S
  - Details: Run `npm run build` in apps/web/. Fix any remaining import errors. Verify successful build. Verify `npm run dev` starts without server-side errors.

### Group M: Frontend Auth Guard + API Client Update

- [ ] **T-040** | RED | Write failing test for AuthGuard component
  - AC: AC-6, AC-7
  - Effort: M
  - Test: `apps/web/__tests__/auth-guard.test.tsx` — render AuthGuard; mock fetch for /api/auth/session; test renders children when authenticated; test redirects when not authenticated; test shows skeleton while loading
  - Details: Mock `next/navigation` useRouter. Mock fetch response for /api/auth/session. Three states: loading, authenticated (show children), unauthenticated (redirect).

- [ ] **T-041** | GREEN | Implement AuthGuard component
  - AC: AC-6, AC-7
  - Effort: M
  - Files: `apps/web/components/auth-guard.tsx`
  - Details: `"use client"` component. Uses `useEffect` to call `GET /api/auth/session`. On mount: set loading=true, fetch, parse response. If `authenticated=true`: show children. If `authenticated=false`: `router.push("/login")`. While loading: show skeleton/spinner.

- [ ] **T-042** | RED | Write failing test for updated API client
  - AC: AC-1, AC-8
  - Effort: S
  - Test: `apps/web/__tests__/api-client.test.ts` — mock fetch; test `postJson('/api/chat', body)` sends correct request shape; test handles 401; test parses response
  - Details: Verify request body and headers. Verify error handling for non-OK responses.

- [ ] **T-043** | GREEN | Update API client + wire frontend pages
  - AC: AC-1, AC-6, AC-7, AC-8
  - Effort: M
  - Files: `apps/web/lib/api-client.ts`, `apps/web/app/page.tsx`, `apps/web/app/chat/page.tsx`, `apps/web/app/login/page.tsx`, `apps/web/components/chat-box.tsx`, `apps/web/components/login-form.tsx`
  - Details: Update `api-client.ts` — ensure base URL is relative (`/api/...`). Update `page.tsx` — remove server-side `verifySession()`; make client component that wraps in AuthGuard. Update `chat/page.tsx` — wrap in AuthGuard. Update `login/page.tsx` — remove server-side redirect; use client-side check. Update `login-form.tsx` — call `POST /api/auth/login`, handle response and cookie. Update `chat-box.tsx` — call `POST /api/chat` with correct request shape. Update `types/index.ts` — remove entity imports; keep only frontend-facing types.

- [ ] **T-044** | REFACTOR | Frontend wiring cleanup
  - AC: AC-6, AC-7
  - Effort: S
  - Details: Remove any remaining server component imports. Verify all pages use `"use client"` where needed. Verify `@/` path alias still resolves correctly.

### Group N: Docker & Nginx Configuration

- [ ] **T-045** | RED | Write failing test for Docker Compose setup
  - AC: AC-10, AC-11
  - Effort: L
  - Test: `apps/backend/__tests__/integration/docker-compose.spec.ts` — script that runs `docker compose up -d` and verifies all 4 services healthy
  - Details: Check `docker compose ps` shows all services "healthy" or "running". Curl https://localhost:8443/api/auth/session → 200. Curl https://localhost:8443 → 200 (frontend HTML).

- [ ] **T-046** | GREEN | Create Dockerfiles + update docker-compose.yml + nginx.conf
  - AC: AC-10, AC-11
  - Effort: M
  - Files: `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml` (MODIFY), `nginx.conf` (MODIFY), `Dockerfile` (DELETE)
  - Details: Create `Dockerfile.backend` — multi-stage (deps → builder → runner). Node 22 Alpine, install deps, build NestJS, copy dist + node_modules + scripts. Expose 3001. CMD: `node dist/main.js`. Create `Dockerfile.frontend` — multi-stage for Next.js static build. Expose 3000. CMD: `npx next start`. Delete old `Dockerfile`. Update `docker-compose.yml` — replace `app` service with `backend` + `frontend`. Add depends_on chains. Update `nginx.conf` — proxy `/api/` → `backend:3001`, `/` → `frontend:3000`.

- [ ] **T-047** | GREEN | Add health check endpoint + wire Docker
  - AC: AC-10
  - Effort: S
  - Files: `apps/backend/src/app.controller.ts` (health endpoint)
  - Details: Add `GET /api/health` → `{ status: "ok" }` endpoint (unguarded). Add healthcheck to backend service in docker-compose: `curl -f http://localhost:3001/api/health`.

- [ ] **T-048** | REFACTOR | Docker cleanup
  - AC: AC-10, AC-11
  - Effort: S
  - Details: Add `.dockerignore` files. Verify `restart: unless-stopped` on all services. Verify no secrets in image layers.

### Group O: End-to-End Integration Verification

- [ ] **T-049** | RED | Write failing E2E integration test suite
  - AC: AC-1, AC-3, AC-6, AC-8
  - Effort: L
  - Test: `apps/backend/__tests__/e2e/full-flow.e2e-spec.ts` — full user journey: login → session check → chat query
  - Details: With Docker Compose running, test: (1) GET /login → returns HTML. (2) POST /api/auth/login → sets cookie. (3) GET /api/auth/session → authenticated=true. (4) POST /api/chat → returns answer with citations. (5) POST /api/auth/logout → clears session.

- [ ] **T-050** | GREEN | Verify full flow passes
  - AC: AC-1, AC-3, AC-6, AC-8
  - Effort: S
  - Details: Run full E2E suite. Debug any failures. All must pass.

### Final Refactor

- [ ] **T-051** | REFACTOR | Global cleanup pass
  - AC: All
  - Effort: M
  - Details: Update root `package.json` scripts. Run all tests across backend and frontend. Run `npx tsc --noEmit` in both projects. Verify `.env.example` is updated. Update `AGENTS.md` if conventions changed (NestJS conventions, new project structure). Remove any dead code, unused imports, stale comments.

---

## Task Summary by AC

| AC ID | Covered By Tasks | Status |
|-------|-----------------|--------|
| AC-1 | T-028, T-029, T-043, T-046, T-049, T-050 | — |
| AC-2 | T-003, T-004, T-037, T-038, T-039 | — |
| AC-3 | T-037, T-038 | — |
| AC-4 | T-037, T-038 | — |
| AC-5 | T-037, T-038 | — |
| AC-6 | T-006, T-007, T-008, T-009, T-040, T-041, T-043, T-044, T-049 | — |
| AC-7 | T-006, T-007, T-008, T-009, T-040, T-041, T-043, T-044 | — |
| AC-8 | T-026, T-027, T-028, T-029, T-042, T-043, T-049, T-050 | — |
| AC-9 | T-011–T-025, T-026, T-027 | — |
| AC-10 | T-045, T-046, T-047, T-048 | — |
| AC-11 | T-045, T-046, T-048 | — |
| AC-12 | T-031, T-032, T-033 | — |
| AC-13 | T-034, T-035, T-036 | — |
| AC-14 | T-034, T-035, T-036 | — |

---

## Effort Summary

| Size | Count | Tasks |
|------|-------|-------|
| S | 26 | T-001, T-003, T-005, T-006, T-009, T-010, T-011, T-012, T-013, T-014, T-015, T-016, T-017, T-018, T-019, T-020, T-021, T-022, T-025, T-029, T-030, T-031, T-032, T-033, T-036, T-039, T-044, T-047, T-048, T-050 |
| M | 22 | T-002, T-004, T-007, T-008, T-023, T-024, T-026, T-027, T-034, T-035, T-038, T-040, T-041, T-043, T-045, T-046 |
| L | 4 | T-028, T-045, T-049, T-051 |

---

## Progress Tracker

| Task | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| T-001 | Pending | — | — | |
| T-002 | Pending | — | — | |
| T-003 | Pending | — | — | |
| T-004 | Pending | — | — | |
| T-005 | Pending | — | — | |
| T-006 | Pending | — | — | |
| T-007 | Pending | — | — | |
| T-008 | Pending | — | — | |
| T-009 | Pending | — | — | |
| T-010 | Pending | — | — | |
| T-011 | Pending | — | — | |
| T-012 | Pending | — | — | |
| T-013 | Pending | — | — | |
| T-014 | Pending | — | — | |
| T-015 | Pending | — | — | |
| T-016 | Pending | — | — | |
| T-017 | Pending | — | — | |
| T-018 | Pending | — | — | |
| T-019 | Pending | — | — | |
| T-020 | Pending | — | — | |
| T-021 | Pending | — | — | |
| T-022 | Pending | — | — | |
| T-023 | Pending | — | — | |
| T-024 | Pending | — | — | |
| T-025 | Pending | — | — | |
| T-026 | Pending | — | — | |
| T-027 | Pending | — | — | |
| T-028 | Pending | — | — | |
| T-029 | Pending | — | — | |
| T-030 | Pending | — | — | |
| T-031 | Pending | — | — | |
| T-032 | Pending | — | — | |
| T-033 | Pending | — | — | |
| T-034 | Pending | — | — | |
| T-035 | Pending | — | — | |
| T-036 | Pending | — | — | |
| T-037 | Pending | — | — | |
| T-038 | Pending | — | — | |
| T-039 | Pending | — | — | |
| T-040 | Pending | — | — | |
| T-041 | Pending | — | — | |
| T-042 | Pending | — | — | |
| T-043 | Pending | — | — | |
| T-044 | Pending | — | — | |
| T-045 | Pending | — | — | |
| T-046 | Pending | — | — | |
| T-047 | Pending | — | — | |
| T-048 | Pending | — | — | |
| T-049 | Pending | — | — | |
| T-050 | Pending | — | — | |
| T-051 | Pending | — | — | |

---

## Blockers & Dependencies

| Task | Blocked By | Description | Resolution |
|------|-----------|-------------|------------|
| T-004 | T-002 | NestJS scaffolding must exist | Sequential |
| T-007 | T-004 | Database module + entities must exist | Sequential |
| T-024 | T-004 | Retrieval needs DataSource from DatabaseModule | Sequential |
| T-027 | T-012, T-015, T-018, T-021, T-024 | Chat module depends on all sub-modules | Sequential |
| T-029 | T-027, T-028 | E2E tests need controller + tests written | Sequential |
| T-035 | T-004 | Scripts need entities and services | Sequential |
| T-038 | T-002–T-036 | Cleanup only after backend is working | Sequential |
| T-043 | T-038, T-041 | Frontend pages need auth guard + cleaned deps | Sequential |
| T-046 | T-002, T-038 | Docker needs both apps built | Sequential |
| T-049 | T-046 | E2E needs Docker Compose running | Sequential |

---

## Sign-off

- [ ] All tasks mapped to ACs
- [ ] TDD order maintained (test before implementation)
- [ ] Ready for Phase 4 (Verification)
