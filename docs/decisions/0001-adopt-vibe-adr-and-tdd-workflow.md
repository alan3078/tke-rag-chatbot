# ADR-0001: Adopt Vibe ADR + TDD Workflow

> **Status**: Accepted
> **Date**: 2026-06-23
> **Deciders**: Alan, Agent
> **Scope**: Project-wide development process

---

## Context and Problem Statement

This project is a production RAG chatbot built in collaboration with AI agents. Without a structured workflow, AI-generated code lacks traceability — we lose track of *why* choices were made, what assumptions exist, and how to safely evolve the system. We need a lightweight method that preserves intention as living documentation while enabling fast AI-assisted development.

## Decision Drivers

- AI agents generate code fast but lose context across sessions
- Architectural decisions need to be recorded for evaluators (code quality = 30% of grade)
- The project has zero tests — we need a disciplined approach to add them
- Multiple features must be built in parallel without conflicts
- Evaluators grade code quality, architecture, and documentation

## Considered Options

### Option A: No formal process (vibe code)
- Fastest to start, but untrackable. No decision history. AI drifts.

### Option B: Heavy Agile (JIRA, Scrum ceremonies)
- Overkill for a solo/small-team challenge project. Too much ceremony.

### Option C: Vibe ADR + 5-Phase TDD Workflow (Chosen)
- Lightweight ADRs for architectural decisions (docs/decisions/)
- 5-phase feature workflow: Proposal → Design → Tasks (TDD) → Verification → Archive
- Templates enforce blast radius, anti-patterns, constraints, security analysis
- Just enough structure without slowing down AI-assisted development

## Decision Outcome

**Chosen: Option C — Vibe ADR + 5-Phase TDD Workflow**

### Structure

```
docs/
├── decisions/           # ADRs — architectural decision records
│   ├── 0001-*.md        # Sequential, zero-padded
│   └── ...
├── templates/           # Phase templates (copy, don't edit)
│   ├── 01-proposal.md   # Business req, ACs, blast radius, anti-patterns
│   ├── 02-design.md     # Tech design, diagrams, security, data spec
│   ├── 03-tasks.md      # TDD task breakdown (Red-Green-Refactor)
│   ├── 04-verification.md  # Test execution, AC verification matrix
│   └── 05-archive.md    # Lessons learned, decision log
├── active/              # Features currently in progress
│   └── FEAT-XXX-name/   # One folder per feature
└── archive/             # Completed features
```

### Rules

1. **Every significant decision gets an ADR** in `docs/decisions/`
2. **Every feature follows the 5-phase workflow** in `docs/active/`
3. **TDD is mandatory**: failing test first, then implementation, then refactor
4. **Phase gates require user approval** at Phase 1 (Proposal) and Phase 2 (Design)
5. **Templates enforce analysis**: blast radius, anti-patterns, constraints, security

### ADR vs Feature Workflow

| When | Use |
|------|-----|
| Architectural/tech stack decision | ADR in `docs/decisions/` |
| Feature implementation with code changes | 5-phase workflow in `docs/active/` |
| ADR that triggers code changes | ADR first, then FEAT workflow to implement |

## Consequences

### Positive
- Decisions are traceable and reviewable by evaluators
- AI agents can read ADRs and FEAT docs to understand context
- TDD ensures test coverage grows with every feature
- Blast radius analysis prevents unintended side effects

### Negative
- Small overhead per feature (~30 min for proposal + design docs)
- Risk of over-documentation for trivial changes (mitigate: only for "significant" changes)

### Neutral
- ADRs are append-only; superseded decisions are marked as such, never deleted

## Confirmation

- [x] `docs/decisions/` directory created
- [x] `docs/templates/` with all 5 phase templates created
- [x] `docs/active/` and `docs/archive/` directories created
- [x] `docs/WORKFLOW.md` created with full process documentation
- [x] `AGENTS.md` updated with workflow instructions
