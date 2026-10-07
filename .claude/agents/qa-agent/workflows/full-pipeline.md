# Workflow: full-pipeline

Use this workflow when the user asks to take a feature all the way from
requirement analysis to bug reporting.

## Phases

1. **requirement-analysis**
   - Input: user's feature description (free text)
   - Output: `artifacts/requirements/<feature>.md`
   - Validation: file exists, contains `## Functional Requirements`,
     `## Positive Scenarios`, `## Negative Scenarios`.

2. **test-case-writing**
   - Input: requirement artifact
   - Output: `artifacts/test-cases/<feature>.json`
   - Validation: file exists, parses as JSON, has `cases` array,
     each case has `id`, `feature`, `scenario`, `steps[]`, `expectedResult`.

3. **test-automation-generator**
   - Input: test-cases artifact
   - Output: `artifacts/automation/<feature>/<test-id>.spec.ts`
   - Validation: file exists, imports from `automation/pages/` or
     `automation/fixtures/`, contains at least one `test()` block.

4. **test-automation-reviewer**
   - Input: generated spec + selector cheatsheet
   - Output: `artifacts/automation-reviews/<feature>-review.md`
   - Validation: file exists, verdict is PASS | PASS WITH WARNINGS | FAIL.

5. **test-automation-execution**
   - Input: review verdict must be PASS or PASS WITH WARNINGS
   - Output: HTML report under `reports/html-report/`,
     JSON summary under `reports/last-run.json`
   - Validation: report file exists.

6. **bug-reporting** (conditional)
   - Trigger: any test failed in the previous step
   - Output: `artifacts/bug-reports/BUG-<id>.md`
   - Validation: file exists, has `## Steps to Reproduce`,
     `## Expected Result`, `## Actual Result`.

## Halt conditions

- A phase fails validation → halt and report.
- Review verdict is FAIL → halt and report. Do not run tests.
