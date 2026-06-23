# Phase 4: Verification — [Feature Title]

> **Status**: VERIFICATION
> **Tasks**: [link to 03-tasks.md]
> **Author**: [name / agent]
> **Date**: YYYY-MM-DD
> **Feature ID**: FEAT-XXX

---

## 1. Test Execution Summary

### Unit Tests

```bash
# Command to run unit tests
npm test -- --testPathPattern="__tests__/feature"
```

| Test Suite | Tests | Pass | Fail | Skip | Duration |
|-----------|-------|------|------|------|----------|
| | | | | | |
| **Total** | | | | | |

### Integration Tests

```bash
# Command to run integration tests
npm test -- --testPathPattern="__tests__/feature.integration"
```

| Test Suite | Tests | Pass | Fail | Skip | Duration |
|-----------|-------|------|------|------|----------|
| | | | | | |

### E2E Tests (if applicable)

```bash
# Command to run e2e tests
npm run test:e2e -- --spec="e2e/feature.spec.ts"
```

| Test Suite | Tests | Pass | Fail | Skip | Duration |
|-----------|-------|------|------|------|----------|
| | | | | | |

## 2. AC Verification Matrix

Every AC from Phase 1 must be verified here.

| AC ID | Description | Test ID(s) | Result | Evidence |
|-------|-------------|------------|--------|----------|
| AC-1 | | T-002 | PASS / FAIL | _test output or screenshot_ |
| AC-2 | | T-004 | PASS / FAIL | |
| AC-3 | | | PASS / FAIL | |

## 3. Test Coverage

```bash
# Command to generate coverage report
npm test -- --coverage --testPathPattern="__tests__/feature"
```

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| | % | % | % | % |
| **Overall** | % | % | % | % |

**Coverage target**: >= 80% for new code

## 4. Manual Verification Checklist

- [ ] Feature works in development environment
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No lint warnings on changed files
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in browser
- [ ] Docker build succeeds (if deployment-relevant)

## 5. Regression Check

- [ ] Existing tests still pass (`npm test`)
- [ ] No unintended side effects on other features
- [ ] API backward compatibility maintained (if applicable)

## 6. Performance Verification (if applicable)

| Metric | Baseline | Current | Target | Status |
|--------|----------|---------|--------|--------|
| | | | | |

## 7. Issues Found

| # | Description | Severity | Resolution | Status |
|---|-------------|----------|------------|--------|
| 1 | | Low/Med/High/Critical | | Open/Fixed |

## 8. Test Artifacts

_Attach or link to:_

- [ ] Full test output logs
- [ ] Coverage report HTML
- [ ] Screenshots (for UI changes)

---

## Verification Result

- **Overall Status**: PASS / FAIL / PARTIAL
- **Blockers for release**: None / [list blockers]

---

## Sign-off

- [ ] All ACs verified with passing tests
- [ ] Coverage meets threshold
- [ ] No critical issues open
- [ ] Ready for Phase 5 (Archive)
