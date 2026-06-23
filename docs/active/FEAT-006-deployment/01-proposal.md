# Phase 1: Proposal — Deployment & Infrastructure

> **Status**: PROPOSAL
> **Author**: Agent
> **Date**: 2026-06-23
> **Feature ID**: FEAT-006

---

## 1. Problem Statement

The RAG chatbot must be deployed and publicly accessible via HTTPS on the provided server. The deployment stack (Docker Compose + Nginx + PostgreSQL) must be reproducible, secure, and resilient. The database must be seeded with the crawled and embedded corpus from the local development machine.

**Current state**: All infrastructure files exist and are complete:
- `docker-compose.yml` (47 lines) — 3 services: postgres, app, nginx
- `Dockerfile` (51 lines) — Multi-stage build, standalone Next.js
- `nginx.conf` (34 lines) — SSL termination on 8443, proxy to app:3000
- `.env.example` (53 lines) — All variables documented

However: zero tests for deployment, no health check endpoint in the app, no smoke test script, and the deployment workflow (local embedding → pg_dump → server restore) is undocumented as a runnable script.

## 2. Business Requirements

| # | Requirement | Priority | Rationale |
|---|-------------|----------|-----------|
| BR-1 | App accessible via HTTPS on provided server at port 8443 | Must | Challenge: "Must be accessible via HTTPS on 123.59.90.15:8443" |
| BR-2 | Docker Compose deployment (single `docker compose up`) | Must | Reproducible, consistent deployment |
| BR-3 | PostgreSQL with pgvector for data storage | Must | Required for vector search |
| BR-4 | Nginx SSL termination with self-signed cert | Must | HTTPS requirement; no domain name available |
| BR-5 | Database seeding: local pg_dump → server restore | Must | Embeddings run locally (API blocked from server) |
| BR-6 | Proper .env.example with all required variables | Must | Challenge: "Configuration examples" in repo |
| BR-7 | Health check for app readiness | Should | Deployment reliability |
| BR-8 | Non-root container execution | Should | Security best practice |

## 3. Stakeholder Analysis

| Stakeholder | Role | Concern | How We Address It |
|-------------|------|---------|-------------------|
| End User | Accesses the chatbot via browser | Must work reliably at the HTTPS URL | Docker restart policies, health checks |
| Evaluator | Tests the deployed system | Must be accessible, responsive, stable | Docker Compose with health checks, Nginx SSL |
| Developer | Deploys and troubleshoots | Deployment must be simple, logs accessible | Single `docker compose up -d --build` command |
| Ops / Deploy | Manages the server | Resource usage, security, uptime | Non-root containers, named volumes, restart policies |

## 4. User Stories

- **US-1**: As a developer, I want to deploy the entire stack with `docker compose up -d --build`, so that deployment is a single command.
- **US-2**: As a developer, I want to transfer the local database (with embeddings) to the server via pg_dump/pg_restore, so that the server has the full corpus without needing embedding API access.
- **US-3**: As an evaluator, I want to access the chatbot at the HTTPS URL and see the login page immediately, so that I can start testing.
- **US-4**: As a developer, I want a health check endpoint, so that Docker can detect when the app is ready.

## 5. Acceptance Criteria (AC)

| AC ID | User Story | Given | When | Then | Test Type |
|-------|-----------|-------|------|------|-----------|
| AC-1 | US-1 | A server with Docker and Docker Compose installed | When `docker compose up -d --build` runs | Then all 3 services (postgres, app, nginx) start successfully | Integration |
| AC-2 | US-3 | The stack is running | When a browser navigates to `https://<server>:8443` | Then the login page is displayed (HTTPS works) | E2E |
| AC-3 | US-2 | A local database with articles and embedded chunks | When `pg_dump` is run locally and restored on the server | Then the server database contains all articles and chunks with embeddings | Integration |
| AC-4 | US-1 | The Docker Compose config | When the postgres container starts | Then the pgvector extension is available | Integration |
| AC-5 | US-4 | The Next.js app is running | When `/api/health` is requested | Then it returns 200 with `{"status":"ok"}` | Unit |
| AC-6 | US-1 | The Dockerfile | When the image is built | Then it runs as a non-root user (nextjs:1001) | Unit (Dockerfile inspection) |
| AC-7 | US-1 | The nginx.conf | When HTTPS request arrives at port 8443 | Then it terminates SSL and proxies to the app on port 3000 | Integration |
| AC-8 | US-1 | A service crashes | When Docker restart policy is configured | Then the service restarts automatically | Integration |

## 6. Blast Radius

### Components Affected

| Component | Impact | Risk Level |
|-----------|--------|------------|
| `docker-compose.yml` | Direct — all services defined here | High |
| `Dockerfile` | Direct — app build and runtime | High |
| `nginx.conf` | Direct — SSL and proxy config | High |
| `.env` / `.env.example` | Direct — runtime configuration | Med |
| `apps/web/app/api/health/route.ts` | Create — new health check endpoint | Low |
| All application code | Indirect — runs inside Docker | Low |

### Data Impact

- **Database changes**: None to schema — pg_dump/restore transfers data
- **Existing data**: Production data is the transferred local database
- **Rollback complexity**: Moderate — `docker compose down && docker compose up` with previous image

## 7. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|-------------|-------------|------------------|
| Running containers as root | Security risk, privilege escalation | Non-root user (nextjs:1001) in Dockerfile |
| Committing SSL certificates to git | Secret exposure | Generate on server, mount via volume, `.gitignore` certs |
| Committing `.env` with real secrets | Credential leak | `.env.example` only; `.env` in `.gitignore` |
| Using `latest` tag for base images | Non-reproducible builds | Pin versions: `node:22-alpine`, `postgres:16` |
| No health checks | Unhealthy containers keep receiving traffic | Health check endpoint + Docker health check config |
| `synchronize: true` in production | Data loss risk from schema drift | Migrations only (`npm run migration:run`) |
| Embedding on the server | Ollama not needed on server; embed locally | Embed locally via Ollama, pg_dump to server |

## 8. Constraints

| Constraint | Source | Implication |
|-----------|--------|-------------|
| Server: provided IP, port 8443 only | Challenge rules | Nginx listens on 8443, self-signed SSL cert |
| No domain name (IP access only) | Challenge rules | Self-signed cert, browser security warning expected |
| OpenAI/Claude APIs blocked from server | Infrastructure (China firewall) | Only OpenRouter (for LLM) works from server; embeddings done locally |
| Embeddings generated locally via Ollama | Infrastructure | Embeddings must be pre-generated locally and transferred via pg_dump |
| Server resources unknown (assumed modest) | Infrastructure | Optimize Docker image size, use standalone Next.js output |

## 9. Security Requirements

| Requirement | Priority | Implementation |
|------------|----------|----------------|
| HTTPS only (no HTTP fallback) | Must | Nginx SSL on 8443, no port 80 listener |
| No secrets in Docker image layers | Must | Secrets via env vars at runtime, not build args |
| Non-root container execution | Must | `USER nextjs` in Dockerfile |
| SSL certificates not in git | Must | `.gitignore` includes `certs/` |
| Database not exposed to public network | Must | Postgres only on Docker internal network |
| No `.env` in git | Must | `.gitignore` includes `.env` |

### Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|------------|
| Database exposure | Direct connection to postgres port | Postgres not exposed to host network (internal Docker network only) |
| Man-in-the-middle | HTTP interception | HTTPS with SSL (self-signed, but encrypted) |
| Container escape | Vulnerability in Node.js or postgres | Non-root execution, minimal Alpine base image, pinned versions |
| Secret leakage | Secrets in Docker layers or git | Runtime env vars only, `.gitignore` coverage |

## 10. Out of Scope

- Domain name / DNS setup
- Let's Encrypt / auto-renewing certificates
- CI/CD pipeline (manual deployment for challenge)
- Horizontal scaling / load balancing
- Monitoring / alerting (Prometheus, Grafana, etc.)
- Database backups / point-in-time recovery
- Blue-green or canary deployment

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Server doesn't have Docker installed | Low | High | Document prerequisite; challenge likely provides Docker |
| pg_dump/restore version mismatch | Med | Med | Use same PostgreSQL version (16) locally and on server |
| Self-signed cert rejected by browser | Certain | Low | Expected — evaluator clicks through warning; document in README |
| Node.js native modules fail on Alpine | Low | Med | Already handled in Dockerfile (copies nodejieba bindings) |
| Docker build fails on server (slow network) | Med | Med | Build locally, `docker save` → transfer → `docker load` |

## 12. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| All 3 services running | 100% uptime during evaluation | `docker compose ps` |
| HTTPS accessible | Login page loads at https://<server>:8443 | Browser test |
| Full corpus available | Same article/chunk count as local | SQL query comparison |
| Cold start time | < 30 seconds from `docker compose up` | Timer |
| Test coverage | Health check endpoint tested | Unit test |

## 13. Open Questions

- [ ] Does the server already have Docker and Docker Compose installed? — Assume yes
- [ ] What are the server's resource constraints (CPU, RAM, disk)? — Assume modest (2-4 CPU, 4-8 GB RAM)
- [x] Can we use `docker save`/`docker load` instead of building on server? — Yes, as fallback

---

## Sign-off

- [ ] Stakeholder review complete
- [ ] AC agreed upon
- [ ] Ready for Phase 2 (Design)
