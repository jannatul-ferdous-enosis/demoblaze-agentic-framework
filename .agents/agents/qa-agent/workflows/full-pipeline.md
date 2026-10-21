# Workflow: full-pipeline

Use this workflow when the user asks to take a feature all the way from
requirement analysis to bug reporting.

## Pre-phase: requirement resolution

Before phase 1, the agent runs requirement resolution (see
`agent.md` → "Requirement resolution"):

- If a file in `inputs/requirements/<feature>.md` is discovered (or the
  user cited an explicit path), `requirementSourcePath` is set on the
  requirement-analysis skill.
- If no file is found, fall back to a chat-supplied `description` (or
  ASK the user for one).

## Phases

1. **requirement-analysis**
   - Input: `requirementSourcePath` from the pre-phase (preferred) OR
     a free-text `description` in chat.
   - Output: `artifacts/requirements/<feature>.md`. Must include a
     `## Source` section if `requirementSourcePath` was used.
   - Validation: file exists, contains `## Functional Requirements`,
     `## Positive Scenarios`, `## Negative Scenarios`.

2. **test-case-writing**
   - Input: requirement artifact
   - Output: `artifacts/test-cases/<feature>.json`
   - Validation: file exists, parses as JSON, has `cases` array,
     each case has `id`, `feature`, `scenario`, `steps[]`, `expectedResult`.

3. **test-case-reviewer**
   - Input: test-cases artifact + requirement artifact
   - Output: `artifacts/test-case-reviews/<feature>-review.md`
   - Validation: file exists, verdict is PASS | PASS WITH WARNINGS | FAIL.

4. **test-automation-generator**
   - Input: test-cases artifact
   - Precondition: the test-case-reviewer verdict must be PASS or
     PASS WITH WARNINGS.
   - Output: `artifacts/automation/<feature>/<test-id>.spec.ts`
   - Validation: file exists, imports from `automation/pages/` or
     `automation/fixtures/`, contains at least one `test()` block.

5. **test-automation-reviewer**
   - Input: generated spec + selector cheatsheet
   - Output: `artifacts/automation-reviews/<feature>-review.md`
   - Validation: file exists, verdict is PASS | PASS WITH WARNINGS | FAIL.

6. **test-automation-execution**
   - Input: review verdict must be PASS or PASS WITH WARNINGS
   - Output: HTML report under `reports/html-report/`,
     JSON summary under `reports/last-run.json`
   - Validation: report file exists.

7. **bug-reporting** (conditional)
   - Trigger: any test failed in the previous step
   - Output: `artifacts/bug-reports/BUG-<id>.md`
   - Validation: file exists, has `## Steps to Reproduce`,
     `## Expected Result`, `## Actual Result`.

## Halt conditions

- A phase fails validation → halt and report.
- Review verdict is FAIL → halt and report. Do not run tests.
