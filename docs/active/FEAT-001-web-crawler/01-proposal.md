# Phase 1: Proposal — Web Crawler & Content Ingestion

> **Status**: PROPOSAL
> **Author**: Agent
> **Date**: 2026-06-23
> **Feature ID**: FEAT-001

---

## 1. Problem Statement

The RAG system needs a complete, structured corpus of ~850 pages from `www.thss.tsinghua.edu.cn`. Without a reliable, section-aware crawler that extracts clean article content (title, date, section, body, images), the downstream chunking and retrieval layers have nothing to work with. The crawler must be ethical, polite, and produce consistent, upsert-safe data.

**Current state**: `scripts/crawl.ts` exists (421 lines) and is functionally complete — 17 sections defined, pagination support, polite 1 req/sec, image extraction. However, it has **zero tests**, so correctness, edge cases, and regressions are unverified.

**Bilingual note**: The site content is almost entirely in Chinese. Some articles contain occasional English terms (e.g., "ACM Fellow", "IEEE WiOpt"). The site has an "English" nav link but individual article pages (e.g., `/info/1023/2687.htm`) have no English translation. **The crawler does NOT need to translate content.** "Bilingual support" in the challenge means the RAG system can accept queries in either language and respond accordingly — that is handled at the retrieval and LLM layers (FEAT-003, FEAT-004), not the crawler.

## 2. Business Requirements

| # | Requirement | Priority | Rationale |
|---|-------------|----------|-----------|
| BR-1 | Crawl all 5 main columns + static pages from the target site | Must | Challenge requires full-site coverage (~850 pages) |
| BR-2 | Extract structured data: title, date, section, body text, images | Must | Downstream chunking needs clean structured input |
| BR-3 | Handle pagination across list pages (新闻动态, 学生动态, etc.) | Must | Most articles are behind paginated list pages |
| BR-4 | Respect robots.txt and rate-limit to 1-2 req/sec | Must | Challenge rule: ethical crawling |
| BR-5 | Upsert logic: skip already-crawled URLs, update if needed | Should | Supports incremental re-crawls without duplicates |
| BR-6 | Proper User-Agent header identifying the bot | Must | Challenge rule: set proper User-Agent |

## 3. Stakeholder Analysis

| Stakeholder | Role | Concern | How We Address It |
|-------------|------|---------|-------------------|
| End User | Queries the chatbot | Needs comprehensive coverage — no missing articles | Crawl all sections, verify with coverage checker |
| Evaluator | Grades correctness (40% weight) | Corpus completeness directly impacts answer quality | Section-aware crawl covers all 5 columns + static pages |
| Developer | Maintains crawler code | Code must be testable, readable, resilient to site changes | Modular parsing, typed interfaces, unit tests |
| Ops / Deploy | Runs the crawl script | Must be idempotent, resumable, with clear logging | Upsert logic, console logging, error handling |

## 4. User Stories

- **US-1**: As a developer, I want to run `npm run crawl` and have the entire target site crawled into the database, so that the corpus is ready for ingestion.
- **US-2**: As a developer, I want the crawler to skip already-crawled URLs, so that I can re-run it safely without duplicates.
- **US-3**: As a developer, I want clear console output showing crawl progress (sections, pages, articles), so that I can monitor and debug the process.
- **US-4**: As an evaluator, I want all 5 main columns fully crawled, so that the chatbot can answer questions from any section.

## 5. Acceptance Criteria (AC)

| AC ID | User Story | Given | When | Then | Test Type |
|-------|-----------|-------|------|------|-----------|
| AC-1 | US-1 | A valid section config with list URL and pagination selector | When the crawler fetches a list page | Then it extracts all article links from that page | Unit |
| AC-2 | US-1 | An article URL | When the crawler fetches the article page | Then it extracts title, date, body text, and image URLs correctly | Unit |
| AC-3 | US-1 | Multiple paginated list pages | When the crawler paginates through them | Then it discovers and follows all pagination links | Unit |
| AC-4 | US-2 | An article URL that already exists in the database | When the crawler encounters it | Then it skips insertion (upsert behavior) | Integration |
| AC-5 | US-1 | A section configuration | When the crawl runs for that section | Then requests are throttled to max 1 per second | Unit |
| AC-6 | US-1 | A fetch request | When the crawler sends it | Then the User-Agent header matches the required format | Unit |
| AC-7 | US-4 | The full section configuration | When a complete crawl finishes | Then all 5 main columns have articles in the database | Integration |
| AC-8 | US-1 | An article page with no date or unusual HTML structure | When the crawler parses it | Then it gracefully handles the missing field without crashing | Unit |

## 6. Blast Radius

### Components Affected

| Component | Impact | Risk Level |
|-----------|--------|------------|
| `scripts/crawl.ts` | Direct — this IS the crawler | High |
| `apps/web/entities/article.entity.ts` | Direct — crawler writes Article records | Med |
| `apps/web/lib/data-source.ts` | Indirect — crawler uses this for DB connection | Low |
| `scripts/ingest.ts` | Indirect — depends on crawler output | Low |

### Data Impact

- **Database changes**: No migration needed — uses existing Article entity
- **Existing data**: Preserved — upsert logic skips existing URLs
- **Rollback complexity**: Simple — delete crawled articles by section if needed

## 7. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|-------------|-------------|------------------|
| Recursive full-site crawl | Uncontrolled scope, may crawl external links, unpredictable page count | Section-aware crawl with known entry points |
| No rate limiting | Violates challenge rules, may get IP-blocked | 1 req/sec `sleep(1000)` between requests |
| Cheerio selectors hardcoded deep in logic | Brittle, hard to test or update when site changes | Extract selectors to config, test parsing separately |
| Swallowing fetch errors silently | Missing articles go unnoticed | Log errors, count failures, surface in summary |
| Storing raw HTML as body text | Wastes storage, bad for chunking | Extract clean text content only |

## 8. Constraints

| Constraint | Source | Implication |
|-----------|--------|-------------|
| Max 1-2 req/sec to target site | Challenge rules | Crawl of ~850 pages takes ~15-20 minutes minimum |
| Must set User-Agent header | Challenge rules | `TKE-RAG-Challenge-Bot/1.0` |
| No raw corpus redistribution | Challenge rules | Don't commit crawled data to git |
| Site uses GBK/UTF-8 mixed encoding | Infrastructure | Must handle encoding correctly in fetch |
| Site may have inconsistent HTML structure | Infrastructure | Parser must handle missing fields gracefully |
| Site content is Chinese-only (no English translations) | Site structure | Crawler stores content as-is; bilingual queries handled by embedding model (qwen3-embedding supports 100+ languages) |

## 9. Security Requirements

| Requirement | Priority | Implementation |
|------------|----------|----------------|
| No secrets in crawler source code | Must | DB credentials via `.env` / `DATABASE_URL` |
| No raw corpus committed to git | Must | `.gitignore` covers database dumps |
| Respect `robots.txt` | Must | Check before crawling |

### Threat Model

Not applicable — crawler is a CLI script running locally, not exposed to the network.

## 10. Out of Scope

- PDF or file attachment crawling (text pages only)
- Image content analysis / OCR
- Real-time / continuous crawling (one-shot batch script)
- Crawling external links outside `www.thss.tsinghua.edu.cn`
- RSS/sitemap-based discovery (we use section list pages)

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Site HTML structure changes | Med | High | Use multiple fallback selectors; test parsing against saved HTML snapshots |
| Rate limiting / IP block from target | Low | High | Strict 1 req/sec; set polite User-Agent |
| Incomplete pagination detection | Low | Med | Test pagination with mock list pages; verify with `check-coverage.ts` |
| Encoding issues with Chinese content | Low | Med | Force UTF-8 decoding; test with known Chinese article content |

## 12. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Articles crawled | >= 800 | `check-coverage.ts` output |
| Sections covered | 5/5 main columns | `check-coverage.ts` by-section report |
| Crawl errors | < 5% of total URLs | Error count in crawl log |
| Test coverage on crawler | >= 60% | Vitest coverage report |

## 13. Open Questions

- [x] Should we re-crawl periodically? — No, one-shot for the challenge
- [ ] Should static pages (学院简介, etc.) be stored as articles with a special section tag? — Currently yes, using section names

---

## Sign-off

- [ ] Stakeholder review complete
- [ ] AC agreed upon
- [ ] Ready for Phase 2 (Design)
