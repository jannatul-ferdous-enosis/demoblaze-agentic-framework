---
name: test-case-writing
description: Generate high-quality, machine-readable manual test cases from requirements, acceptance criteria, or raw feature descriptions. Produces a JSON artifact that downstream skills consume.
---

# Skill: test-case-writing

## Purpose

Generate high-quality, machine-readable manual test cases from requirements,
acceptance criteria, or raw feature descriptions.

## When to use

- User asks to "write test cases", "design tests", "create manual tests".
- After `requirement-analysis`.

## Inputs

| Name                      | Required | Description                                           |
| ------------------------- | -------- | ----------------------------------------------------- |
| `feature`                 | yes      | Slug matching the requirement artifact, e.g. `login`. |
| `requirementArtifactPath` | no       | Path to `artifacts/requirements/<feature>.md`.        |
| `acceptanceCriteria`      | no       | If no artifact exists, raw AC bullets.                |

## Required context

- The selector cheatsheet: `.claude/agents/qa-agent/selector-cheatsheet.md`
- The verified alert() messages and dialog semantics in the cheatsheet
- The requirement artifact, if any

## Workflow

1. Resolve the source of truth (requirement artifact → acceptance criteria
   → feature description).
2. For each positive scenario, write one positive test case.
3. For each negative scenario, write one negative test case.
4. For each boundary case, write one boundary test case.
5. Add at least one **state-related** test case when the feature changes
   session/auth/cart state.
6. Tag each case as `automation_candidate: true|false`.
7. Assign each case a stable ID: `<FEATURE>-<NNN>`, e.g. `LOGIN-001`.
8. De-duplicate: do not produce two cases that test the exact same thing.
9. Verify the steps are _executable_: every step is a single user action or
   observable assertion.

## QA rules / heuristics

- Every test case MUST have all required fields (see Output).
- `steps[]` must be ordered and minimal — no "wait a bit" steps.
- `expectedResult` must be a single, observable outcome.
- `priority` ∈ `P0`, `P1`, `P2`. P0 = critical happy path; P1 = common
  branches; P2 = edge cases.
- `type` ∈ `functional`, `negative`, `boundary`, `validation`,
  `state`, `regression`.
- Avoid generating more than ~20 cases per feature unless the user asks
  for thorough coverage.

## Output format

JSON file at `artifacts/test-cases/<feature>.json`.

```json
{
  "feature": "login",
  "version": "1.0.0",
  "generatedAt": "<ISO-8601>",
  "sourceArtifact": "artifacts/requirements/login.md",
  "cases": [
    {
      "id": "LOGIN-001",
      "feature": "login",
      "scenario": "User logs in with valid credentials",
      "type": "functional",
      "priority": "P0",
      "preconditions": ["User is registered"],
      "testData": { "username": "<username>", "password": "<password>" },
      "steps": [
        "Navigate to /",
        "Click 'Log in' in the navbar",
        "Type username into the Username field",
        "Type password into the Password field",
        "Click 'Log in' in the modal"
      ],
      "expectedResult": "Modal closes; navbar shows 'Welcome <username>' and 'Log out'.",
      "automationCandidate": true,
      "notes": ""
    }
  ]
}
```

A Markdown report MAY also be written to
`artifacts/test-cases/<feature>.md` for human review.

## Validation rules

- File parses.
- `cases` is a non-empty array.
- Every case has: `id`, `feature`, `scenario`, `steps[]` (non-empty),
  `expectedResult`, `priority`, `type`, `automationCandidate`.
- IDs are unique within the file.

## Failure handling

- If no requirement/AC source is available, ASK the user for one.
- If the source describes behavior not in the selector cheatsheet, write
  the case using stable selectors from the cheatsheet and add an open
  question to the requirement artifact (or refuse and ask).

## Dependencies

- Often preceded by `requirement-analysis`.
- Consumed by `test-automation-generator` and `test-case-execution`.
