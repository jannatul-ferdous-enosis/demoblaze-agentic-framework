---
name: test-case-reviewer
description: Review a generated manual test case artifact before it is passed to automation generation. Produces a structured PASS / PASS WITH WARNINGS / FAIL verdict in a Markdown review artifact.
---

# Skill: test-case-reviewer

## Purpose

Review a manually-written test case artifact (produced by `test-case-writing`)
before it is fed into `test-automation-generator`. Catches ambiguity, missing
coverage, traceability gaps, invalid preconditions, and cases that are not
executable as written. Produces a structured PASS / PASS WITH WARNINGS / FAIL
verdict.

## When to use

- After `test-case-writing`, before `test-automation-generator`.
- Whenever the user asks to "review the test cases", "check the test design",
  "is this test case ready to automate".

## Inputs

| Name           | Required | Description                                              |
| -------------- | -------- | -------------------------------------------------------- |
| `feature`      | yes      | Slug matching the test case artifact, e.g. `login`.      |
| `testCasePath` | yes      | Path to the test case JSON file.                         |
| `requirementArtifactPath` | no | Path to `artifacts/requirements/<feature>.md`, if exists. |

## Required context

- The selector cheatsheet: `.agents/agents/qa-agent/selector-cheatsheet.md`
- The verified alert() messages and dialog semantics in the cheatsheet
- The requirement artifact at `requirementArtifactPath` (if present), for
  traceability checks
- The validation rules defined in `test-case-writing/SKILL.md`

## Workflow

1. Read the test case JSON and (optionally) the source requirement artifact.
2. Run the review checks below in order.
3. For each finding, assign severity: `BLOCKER`, `MAJOR`, `MINOR`, `INFO`.
4. Compute the verdict.
5. Write the review artifact.

## Review checks

### Schema & structural correctness

- File parses as valid JSON.
- `feature`, `version`, `generatedAt`, `sourceArtifact`, `cases[]` are all
  present.
- `cases` is a non-empty array.
- Every case has all required fields: `id`, `feature`, `scenario`,
  `priority`, `type`, `steps`, `expectedResult`, `automationCandidate`.
- Every case's `steps[]` is non-empty.
- IDs are unique within the file and follow `<FEATURE>-<NNN>` pattern.
- `priority` ∈ `P0`, `P1`, `P2`. `type` ∈ `functional`, `negative`,
  `boundary`, `validation`, `state`, `regression`.
- `automationCandidate` is a boolean.

### Executability

- Each step is a single user action or single observable assertion. No
  compound steps that chain two or more actions ("Type username and click
  submit").
- No vague timing steps ("wait a bit", "wait for loading").
- Selectors referenced in steps must be stable. If a step names a UI
  element, it should be findable via the selector cheatsheet
  (e.g. "the Log in button in the navbar" is fine; "the blue button" is
  not).
- Any modal interaction step must include both opening and closing the
  modal, or reference a page object that does so.
- Any alert/SweetAlert step must reference an exact verified message from
  the cheatsheet, or be marked with an open question.

### Expected result quality

- `expectedResult` is a single, observable outcome (not "it works", not
  "the system behaves correctly").
- The expected result is testable: a tester reading it knows what to look
  at and what indicates PASS vs FAIL.
- The expected result references UI state that exists in the cheatsheet
  (e.g. `#nameofuser` for logged-in state, item count badge for cart).

### Coverage traceability

- Each positive scenario in the requirement artifact maps to at least one
  `functional` test case.
- Each negative scenario maps to at least one `negative` or `validation`
  test case.
- Each boundary case maps to at least one `boundary` test case.
- Features that mutate session/auth/cart state must include at least one
  `state` test case.
- IDs are unique across artifacts (no collisions with other features).

### Prioritization & candidate fitness

- At least one P0 case exists per feature for the primary happy path.
- P0/P1 cases should have `automationCandidate: true`.
- Cases that cannot be automated (visual verification only, require
  external systems) must have `automationCandidate: false` with a
  `notes` field explaining why.
- No more than ~20 cases per feature unless the user asked for thorough
  coverage (de-duplication check).

### De-duplication

- No two cases test the exact same scenario with the exact same expected
  result. Duplicates should be merged or differentiated.
- Negative/validation pairs should not be identical except for input data.

### Maintainability

- `testData` is provided where the step needs specific values.
- `preconditions` are stated, not assumed.
- `notes` field used for non-obvious context (test ordering constraints,
  manual-only steps, known bugs).
- `sourceArtifact` field references the originating requirement file.

## Verdict rules

- **PASS** — no findings OR only `INFO` findings.
- **PASS WITH WARNINGS** — no `BLOCKER` or `MAJOR` findings; at most
  `MINOR` findings.
- **FAIL** — at least one `BLOCKER` OR at least two `MAJOR` findings.

## Output format

Markdown file at `artifacts/test-case-reviews/<feature>-review.md`.

Required sections:

```markdown
# Review: <feature>

**Verdict:** PASS | PASS WITH WARNINGS | FAIL
**Feature:** <feature>
**Test Case File:** <testCasePath>
**Requirement Artifact:** <requirementArtifactPath or "not provided">
**Reviewed at:** <ISO-8601>

## Summary

<one paragraph>

## Schema & Structural Correctness

- ...

## Executability

- ...

## Expected Result Quality

- ...

## Coverage Traceability

- ...

## Prioritization & Candidate Fitness

- ...

## De-duplication

- ...

## Maintainability

- ...

## Findings

| #   | Severity | Area        | Problem                              | Recommendation |
| --- | -------- | ----------- | ------------------------------------ | -------------- |
| 1   | MAJOR    | Executability | step 3 chains two actions            | split into two steps |
| 2   | MINOR    | Coverage    | missing state case for cart mutation | add CART-005    |
| ... | ...      | ...         | ...                                  | ...            |
```

## Validation rules

- File exists at the specified path.
- Verdict line is present and one of the allowed values.
- Findings table is present (may be empty for PASS).
- Every finding has a severity, area, problem, and recommendation.

## Failure handling

- If the test case file does not exist, refuse with a clear error.
- If the JSON does not parse, refuse with a clear error.
- If the verdict is FAIL, the agent halts the pipeline and reports the
  findings. The user must regenerate or revise the test cases and re-run
  the review.
- If the verdict is PASS WITH WARNINGS, the pipeline may proceed with the
  warnings documented.

## Dependencies

- The test case artifact (produced by `test-case-writing`).
- Optionally the requirement artifact (produced by `requirement-analysis`).
- Consumed by `test-automation-generator`.
