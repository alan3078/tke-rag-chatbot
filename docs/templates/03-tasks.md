# Phase 3: Task Breakdown — [Feature Title]

> **Status**: IN PROGRESS
> **Design**: [link to 02-design.md]
> **Author**: [name / agent]
> **Date**: YYYY-MM-DD
> **Feature ID**: FEAT-XXX

---

## TDD Workflow Reminder

Every implementation task follows **Red-Green-Refactor**:

1. **Red** — Write a failing test that defines the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up while keeping tests green

---

## Task List

Tasks are ordered by dependency. Each task maps to one or more ACs.

### Setup & Infrastructure

- [ ] **T-001**: Set up test infrastructure
  - AC: N/A (enabler)
  - Estimated effort: S
  - Details: Install test deps, configure test runner, create test helpers
  - Files: `jest.config.ts`, `__tests__/setup.ts`

### Test-First Implementation

- [ ] **T-002**: Write failing tests for [AC-1]
  - AC: AC-1
  - Estimated effort: S / M / L
  - Test file: `__tests__/...`
  - Details: _What the tests assert_

- [ ] **T-003**: Implement [AC-1] to pass tests
  - AC: AC-1
  - Estimated effort: S / M / L
  - Files: `apps/web/lib/...`
  - Details: _Implementation approach_

- [ ] **T-004**: Write failing tests for [AC-2]
  - AC: AC-2
  - Estimated effort: S / M / L
  - Test file: `__tests__/...`
  - Details: _What the tests assert_

- [ ] **T-005**: Implement [AC-2] to pass tests
  - AC: AC-2
  - Estimated effort: S / M / L
  - Files: `apps/web/...`
  - Details: _Implementation approach_

### Integration & Wiring

- [ ] **T-006**: Wire components together
  - AC: AC-1, AC-2
  - Estimated effort: M
  - Details: _Integration points_

### Refactor

- [ ] **T-007**: Refactor pass
  - AC: All
  - Estimated effort: S
  - Details: Clean up code, extract shared logic, improve naming

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
| T-001 | Pending | | | | |
| T-002 | Pending | | | | |
| T-003 | Pending | | | | |

---

## Blockers & Dependencies

| Task | Blocked By | Description | Resolution |
|------|-----------|-------------|------------|
| | | | |

---

## Sign-off

- [ ] All tasks mapped to ACs
- [ ] TDD order maintained (test before implementation)
- [ ] Ready for Phase 4 (Verification)
