---
name: test-automation-reviewer
description: Review a generated Playwright spec before it is merged or executed. Produces a structured PASS / PASS WITH WARNINGS / FAIL verdict in a Markdown review artifact.
---

# Skill: test-automation-reviewer

## Purpose

Review a generated Playwright spec before it is merged or executed in CI,
producing a structured PASS / PASS WITH WARNINGS / FAIL verdict.

## When to use

- After `test-automation-generator`, before `test-automation-execution`.

## Inputs

| Name           | Required | Description                   |
| -------------- | -------- | ----------------------------- |
| `specPath`     | yes      | The generated spec file path. |
| `testCasePath` | yes      | The originating test case.    |

## Required context

- The selector cheatsheet: `.agents/agents/qa-agent/selector-cheatsheet.md`
- The Playwright TypeScript conventions in this repo (see
  `automation/pages/`, `automation/fixtures/`)
- The general coding standards (`.eslintrc`, `.prettierrc`)

## Workflow

1. Read the spec and the originating test case.
2. Verify the spec's `test()` corresponds to the test case ID and
   scenario.
3. Run the review checks below.
4. For each finding, assign severity: `BLOCKER`, `MAJOR`, `MINOR`,
   `INFO`.
5. Compute the verdict.
6. Write the review artifact.

## Review checks

### Functional correctness

- Does the test cover the expected result from the test case?
- Are assertions meaningful (not just `toBeDefined`)?
- Does the test exercise user-visible behavior rather than internal
  state?
- Does each step in the test case appear (or have an equivalent)?

### Locator quality

- Are selectors from the cheatsheet when available?
- Any `nth(` usage? Only allow if a comment justifies it.
- Any deep CSS chains (≥ 3 selectors joined)?
- Any styling-dependent selectors (`.btn-success` is allowed, but
  `.text-center` is not)?
- Any brittle selectors (`:has-text` over the whole document)?

### Playwright best practices

- Async/await correct?
- Locators used correctly (no `await locator.click()` on stale locator
  passed across awaits)?
- Any `waitForTimeout(`?
- Any `waitForLoadState('load')` after a click (usually unnecessary)?
- Assertions are auto-retrying (`expect(...).toBeVisible()`) rather than
  `assertTrue(...)`?
- Web-first assertions used (`toBeVisible`, not `isVisible()` + manual
  throw)?
- Dialogs handled via `page.on('dialog')`?
- SweetAlert handled via `waitForSweetAlertAndAccept`?

### Test quality

- Tests independent of execution order?
- Setup/teardown scoped to the right test?
- Each test uses fresh cookies / fresh user where needed?
- No copy-pasted test bodies?

### Maintainability

- Reasonable file organization?
- Descriptive test names?
- No hardcoded credentials?
- Data factories used where appropriate?

## Verdict rules

- **PASS** — no findings OR only `INFO` findings.
- **PASS WITH WARNINGS** — no `BLOCKER` or `MAJOR` findings; at most
  `MINOR` findings.
- **FAIL** — at least one `BLOCKER` OR at least two `MAJOR` findings.

## Output format

Markdown file at `artifacts/automation-reviews/<feature>-review.md`.

Required sections:

```markdown
# Review: <test-id>

**Verdict:** PASS | PASS WITH WARNINGS | FAIL
**Spec:** <specPath>
**Test Case:** <testCasePath>
**Reviewed at:** <ISO-8601>

## Summary

<one paragraph>

## Functional Correctness

- ...

## Locator Quality

- ...

## Playwright Best Practices

- ...

## Test Quality

- ...

## Maintainability

- ...

## Findings

| #   | Severity | Area    | Problem                             | Recommendation |
| --- | -------- | ------- | ----------------------------------- | -------------- |
| 1   | MAJOR    | Locator | uses `nth(0)` without justification | locate by text |
| ... | ...      | ...     | ...                                 | ...            |
```

## Validation rules

- File exists.
- Verdict line is present and one of the allowed values.
- Findings table is present (may be empty for PASS).

## Failure handling

- If the file does not exist, refuse with a clear error.
- If the verdict is FAIL, the agent halts the pipeline.

## Dependencies

- A spec file produced by `test-automation-generator`.
- Consumed by `test-automation-execution`.
