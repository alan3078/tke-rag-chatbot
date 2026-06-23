# Phase 1: Proposal — RAG Pipeline & LLM Integration

> **Status**: PROPOSAL
> **Author**: Agent
> **Date**: 2026-06-23
> **Feature ID**: FEAT-004

---

## 1. Problem Statement

The core RAG pipeline orchestrates the entire question-answering flow: take a user question, retrieve relevant context, generate an LLM answer with citations, and return a structured response. The LLM must be constrained to answer only from provided context, cite sources, and refuse to hallucinate.

**Current state**: `apps/web/lib/rag.ts` (87 lines) and `apps/web/lib/llm.ts` (108 lines) are functionally complete — the pipeline orchestrates retrieval + generation, the LLM client supports both sync and streaming responses, and citation deduplication works. However: zero tests exist, streaming is implemented but unused by the API route, and `react-markdown` is installed but not used in the chat UI (LLM markdown output renders as plain text).

## 2. Business Requirements

| # | Requirement | Priority | Rationale |
|---|-------------|----------|-----------|
| BR-1 | Generate answers using ONLY the retrieved context (no hallucination) | Must | Challenge: RAG pipeline must actually retrieve and generate |
| BR-2 | Include citations with article title and URL in every answer | Must | Challenge: "Each answer should cite which article(s) it drew from" |
| BR-3 | Answer in the same language as the user's question | Must | Bilingual requirement: Chinese question → Chinese answer |
| BR-4 | Refuse gracefully when context is insufficient | Must | Better to say "I don't know" than hallucinate |
| BR-5 | Deduplicate citations (same article referenced by multiple chunks) | Should | Cleaner citation list for the user |
| BR-6 | Reasonable response latency (< 10s for non-streaming) | Should | Usability requirement |

## 3. Stakeholder Analysis

| Stakeholder | Role | Concern | How We Address It |
|-------------|------|---------|-------------------|
| End User | Asks questions | Wants accurate, cited, readable answers | System prompt constrains LLM; citations always included |
| Evaluator | Grades correctness (40%) | Answer must match ground truth from the corpus | RAG constraint: answer only from context, with citations |
| Developer | Maintains RAG pipeline | Must understand the orchestration flow, debug LLM issues | Clean pipeline: retrieve → format → generate → extract citations |
| Ops / Deploy | Runs in production | LLM API costs and latency | DeepSeek V4 Pro via OpenRouter ($0.43/$0.87 per 1M tokens) |

## 4. User Stories

- **US-1**: As a user, I want to ask a question and receive an accurate answer based on the website content, so that I get reliable information.
- **US-2**: As a user, I want each answer to include clickable source links, so that I can verify the information.
- **US-3**: As a user, I want the chatbot to tell me when it can't find an answer, so that I know the limitation rather than getting a fabricated response.
- **US-4**: As a user, I want answers in the same language I asked in, so that communication is natural.

## 5. Acceptance Criteria (AC)

| AC ID | User Story | Given | When | Then | Test Type |
|-------|-----------|-------|------|------|-----------|
| AC-1 | US-1 | A user question and retrieved context chunks | When `ragQuery()` is called | Then it returns an answer derived from the context | Integration (mocked LLM) |
| AC-2 | US-2 | An answer referencing multiple chunks from different articles | When citations are extracted | Then each unique article URL appears exactly once in the citation list | Unit |
| AC-3 | US-3 | A user question with no relevant context found | When `ragQuery()` is called | Then the answer indicates insufficient information | Unit (mocked retrieval) |
| AC-4 | US-4 | A Chinese question | When the LLM system prompt is constructed | Then it instructs the LLM to answer in the user's language | Unit |
| AC-5 | US-1 | Retrieved chunks | When `formatContext()` is called | Then it produces a numbered list of chunks with source metadata | Unit |
| AC-6 | US-1 | A well-formed context and question | When `generateAnswer()` calls the LLM API | Then the API call includes the system prompt constraining to context-only answers | Unit (mocked HTTP) |
| AC-7 | US-2 | Multiple chunks from the same article | When citations are built | Then only one citation entry exists for that article | Unit |
| AC-8 | US-1 | The LLM API returns an error | When `generateAnswer()` is called | Then it throws a typed error that the route handler can catch | Unit (mocked HTTP) |

## 6. Blast Radius

### Components Affected

| Component | Impact | Risk Level |
|-----------|--------|------------|
| `apps/web/lib/rag.ts` | Direct — pipeline orchestrator | High |
| `apps/web/lib/llm.ts` | Direct — LLM client | High |
| `apps/web/lib/retrieval.ts` | Consumed — called by RAG pipeline | Med |
| `apps/web/lib/embeddings.ts` | Consumed — called by retrieval | Low |
| `apps/web/app/api/chat/route.ts` | Direct consumer — calls `ragQuery()` | Med |
| `apps/web/components/chat-message.tsx` | Indirect — renders LLM output | Low |

### Data Impact

- **Database changes**: None — read-only queries
- **Existing data**: No modifications
- **Rollback complexity**: Simple — stateless module

## 7. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|-------------|-------------|------------------|
| Letting LLM answer without context | Hallucination: makes up facts about the university | System prompt: "Answer ONLY using the provided context" |
| Using LangChain for the RAG pipeline | Challenge requires original implementation | Custom pipeline: retrieve → format → generate |
| Not including citations | Evaluator can't verify answer source | Always include article title + URL in citations |
| Stuffing all chunks into a single prompt | Exceeds token limits, dilutes relevance | Top 5-8 chunks only (controlled by retrieval layer) |
| Exposing raw LLM errors to user | Bad UX, potential info leak | Catch errors, return user-friendly message |

## 8. Constraints

| Constraint | Source | Implication |
|-----------|--------|-------------|
| LLM: OpenRouter → DeepSeek V4 Pro | Infrastructure (China server can't access OpenAI/Anthropic) | Must use OpenAI-compatible client with OpenRouter base URL |
| LLM max tokens: 2000 for response | Design decision | Answers truncated if too long |
| Temperature: 0.3 | Design decision | Lower temperature = more factual, less creative |
| No LangChain | Challenge rules | Custom RAG pipeline required |
| System prompt must prevent hallucination | Challenge rules | Explicit instruction: "do not invent names, dates, awards" |

## 9. Security Requirements

| Requirement | Priority | Implementation |
|------------|----------|----------------|
| LLM API key not in source code | Must | Via `LLM_API_KEY` env var |
| Sanitize user input before sending to LLM | Should | Trim, length limit, no prompt injection |
| Don't expose system prompt to users | Should | System prompt is server-side only |
| Don't leak internal errors to client | Must | Catch LLM errors, return generic message |

### Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|------------|
| Prompt injection | User crafts input to override system prompt | System prompt is separated from user message; LLM instructed to answer from context only |
| API key exposure | Key leaked in client-side code or error messages | Key is server-side env var only; errors sanitized |
| Excessive API costs | Many rapid queries | Auth gate limits access; no public endpoint |

## 10. Out of Scope

- Multi-turn conversation memory (each query is independent)
- Query rewriting / expansion
- Answer streaming to the UI (implemented in LLM client but not wired up)
- Answer caching
- Feedback / rating system
- Answer evaluation against ground truth (separate from this feature)

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM hallucination despite system prompt | Low | High | System prompt with strict constraints; include context verbatim |
| OpenRouter API downtime | Low | High | No fallback for LLM; surface error to user |
| Response too slow (> 10s) | Med | Med | Non-streaming for now; can add streaming later |
| LLM ignores citation instruction | Low | Med | Test with sample questions; system prompt is explicit |

## 12. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Answer accuracy | >= 80% on evaluation question set | Manual grading |
| Citations present | 100% of answers include >= 1 citation | Automated test |
| Graceful refusal | 100% for out-of-corpus questions | Automated test with irrelevant queries |
| Response latency | < 10s average | Timer in API route |
| Test coverage | >= 60% on rag.ts + llm.ts | Vitest coverage report |

## 13. Open Questions

- [ ] Should we add streaming support to the API route? — Not for v1, but the LLM client already supports it
- [ ] Should we add query rewriting before retrieval? — Not for v1
- [ ] Should react-markdown be used to render LLM output? — Yes, follow-up task

---

## Sign-off

- [ ] Stakeholder review complete
- [ ] AC agreed upon
- [ ] Ready for Phase 2 (Design)
