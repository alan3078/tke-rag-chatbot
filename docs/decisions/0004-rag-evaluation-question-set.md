# ADR-0004: RAG Evaluation Question Set Strategy

> **Status**: Accepted
> **Date**: 2026-06-23
> **Deciders**: Alan, Agent
> **Scope**: Testing, quality assurance, evaluation

---

## Context and Problem Statement

The challenge provides a 1000-question RAG evaluation set, categorized by type (Date, Person, Award, Topic, Org, Location, Count) with source links and expected metadata. We need a strategy for storing, running, and scoring these questions against our RAG pipeline to maximize the Correctness score (40% of evaluation grade).

## Decision Drivers

- Correctness is 40% of the grade — the highest-weighted criterion
- 1000 questions across 7 categories with known source articles
- Each question has: Chinese text, English translation, category, expected date, section, source URL
- We need automated evaluation, not manual spot-checking
- Results should guide tuning of chunking, retrieval weights, and prompt engineering

## Blast Radius

### New Files

| File | Purpose |
|------|---------|
| `scripts/evaluate.ts` | Evaluation runner — batch RAG queries, compare results |
| `scripts/data/evaluation-questions.json` | 1000 questions in structured JSON |
| `apps/web/lib/evaluation.ts` | Scoring logic — compare RAG output vs expected |

### UNAFFECTED

| Component | Reason |
|-----------|--------|
| Production code | Evaluation is a dev/test tool, not shipped to users |
| Database schema | Questions stored as JSON file, not in DB |
| Frontend | No UI for evaluation (CLI only) |

## Considered Options

### Option A: Manual testing with sample questions
- **Pro**: Quick, no setup
- **Con**: Can't cover 1000 questions, no regression detection, subjective scoring
- **Verdict**: Inadequate for 40% of grade

### Option B: Store questions in database, evaluate via API
- **Pro**: Query-able, can track results over time
- **Con**: Pollutes production DB, complex setup, over-engineering
- **Verdict**: Unnecessary complexity

### Option C: JSON file + CLI evaluation script (Chosen)
- **Pro**: Simple, version-controlled, reproducible, can run on any machine
- **Con**: No historical tracking (mitigate: commit evaluation results)
- **Verdict**: Right level of complexity for the challenge

## Decision Outcome

**Chosen: Option C — JSON file + CLI evaluation script**

### Question Data Format

```json
{
  "id": 1,
  "question_zh": "文章《...》中提到的事件发生在哪一天？",
  "question_en": "On what date did the event in the article '...' occur?",
  "category": "Date",
  "expected_date": "2011-11-03",
  "expected_section": "新闻动态",
  "source_url": "https://www.thss.tsinghua.edu.cn/..."
}
```

### Evaluation Strategy

```
For each question:
  1. Send question_zh to RAG pipeline
  2. Capture: answer text, citations (URLs), latency
  3. Score:
     a. Citation match: does any citation URL match source_url? (exact or fuzzy)
     b. Category-specific validation:
        - Date: does the answer contain expected_date?
        - Person: does the answer mention the expected person name?
        - Award: does the answer describe the expected achievement?
        - Topic: does the answer address the expected topic?
        - Org: does the answer mention the expected organizations?
        - Location: does the answer mention the expected location?
        - Count: does the answer contain the expected count?
     c. Relevance: does the answer reference content from the correct section?
  4. Aggregate scores by category and overall
```

### Scoring Rubric

| Score | Meaning |
|-------|---------|
| 3 | Correct answer with matching citation |
| 2 | Correct answer, wrong or missing citation |
| 1 | Partially correct (relevant but incomplete) |
| 0 | Wrong answer or "I don't know" for answerable question |

### Running Evaluation

```bash
# Run full evaluation (1000 questions)
npx tsx scripts/evaluate.ts

# Run subset by category
npx tsx scripts/evaluate.ts --category Date --limit 50

# Run specific question by ID
npx tsx scripts/evaluate.ts --id 15
```

### Output Format

```
=== RAG Evaluation Report ===
Total: 1000 | Correct: 750 | Partial: 150 | Wrong: 100
Accuracy: 75.0% | With Citations: 82.0%

By Category:
  Date:     85/100 (85%)
  Person:   72/100 (72%)
  Award:    68/100 (68%)
  Topic:    80/100 (80%)
  Org:      75/100 (75%)
  Location: 70/100 (70%)
  Count:    60/100 (60%)

Avg Latency: 3.2s per question
Results saved to: scripts/data/evaluation-results.json
```

### Anti-Patterns to Avoid

| Anti-Pattern | Why | Correct Approach |
|-------------|-----|-----------------|
| Running evaluation against production API | Rate limits, costs, slow | Run directly against lib functions (bypass HTTP) |
| Exact string matching only | LLM answers vary in phrasing | Pattern matching + key term extraction |
| Evaluating without source URL comparison | Can't tell if retrieval found the right article | Always check citation URLs |
| Running all 1000 at once without rate limiting | May hit LLM API limits | Batch with configurable concurrency (default: 5 parallel) |
| Not saving results to file | Can't compare across runs | Always write JSON results file |

## Consequences

### Positive
- Automated, reproducible evaluation of all 1000 questions
- Category-level scoring identifies weak areas (e.g., Count questions)
- Results guide tuning of retrieval weights, chunk sizes, prompts
- Can run before deployment to catch regressions

### Negative
- Evaluation run costs money (1000 LLM API calls)
- Automated scoring may miss nuanced correctness (mitigate: manual review of borderline cases)

### Neutral
- Evaluation questions are version-controlled but not committed to production DB
- Results file should be gitignored (contains LLM outputs which may vary)

## Confirmation

- [ ] `scripts/data/evaluation-questions.json` created with all 1000 questions
- [ ] `scripts/evaluate.ts` runs and produces report
- [ ] Category-level scoring works for all 7 categories
- [ ] Results saved to JSON for comparison across runs
- [ ] Can filter by category and limit count
