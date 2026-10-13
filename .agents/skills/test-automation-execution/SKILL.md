---
name: test-automation-execution
description: Run the Playwright suite, interpret the results, and produce a QA-friendly JSON and Markdown summary. Reads a review verdict to gate execution.
---

# Skill: test-automation-execution

## Purpose

Run the Playwright suite, interpret the results, and produce a QA-friendly
summary.

## When to use

- After `test-automation-reviewer` returns PASS or PASS WITH WARNINGS.
- User asks to "run the login automation", "execute the smoke tests".

## Inputs

| Name            | Required | Description                                                    |
| --------------- | -------- | -------------------------------------------------------------- |
| `scope`         | no       | One of `smoke`, `feature:<feature>`, `test:<test-id>`, `full`. |
| `reviewVerdict` | no       | Required to gate reading.                                      |

## Required context

- The Playwright config: `automation/playwright.config.ts`
- The CLI: `npm test` (or `npx playwright test`)
- The review verdict (if running from a pipeline)

## Workflow

1. Resolve the Playwright target:
   - `smoke` → `--grep @smoke`
   - `feature:<feature>` → `--grep <feature>`
   - `test:<test-id>` → `--grep <test-id>`
   - `full` → no `--grep`
2. Run the suite via the configured CLI.
3. Capture:
   - stdout/stderr
   - the JSON report (`--reporter=json` then read it)
   - the HTML report path
4. Parse the JSON to produce a summary:
   - Total / Passed / Failed / Skipped / TimedOut
   - Per-test result with duration
5. For each failed test, extract:
   - the assertion message
   - the stack trace
   - the screenshot path (if any)
   - the trace path (if any)
6. Write the execution report.

## QA rules / heuristics

- NEVER mask failures. Always emit FAIL when a test fails.
- NEVER say "all tests passed" without a passing count > 0.
- Preserve the order of failures across runs.
- Round durations to milliseconds.

## Output format

JSON file at `reports/last-run.json`:

```json
{
  "executionId": "<ISO-8601>",
  "scope": "feature:login",
  "executedAt": "<ISO-8601>",
  "totals": { "total": 5, "passed": 4, "failed": 1, "skipped": 0, "timedOut": 0 },
  "tests": [
    {
      "id": "LOGIN-001",
      "title": "User logs in with valid credentials",
      "status": "passed",
      "durationMs": 1234
    },
    {
      "id": "LOGIN-004",
      "title": "Wrong password shows alert",
      "status": "failed",
      "durationMs": 980,
      "error": "Expected alert 'Wrong password.' but got 'User does not exist.'",
      "screenshotPath": "test-results/.../test-failed-1.png"
    }
  ],
  "htmlReportPath": "reports/html-report/index.html",
  "summary": "1 of 5 failed. See htmlReportPath for evidence."
}
```

A Markdown summary MAY also be written at
`reports/last-run.md`.

## Validation rules

- File exists and parses.
- `totals.total` is a non-negative integer.
- `totals.passed + totals.failed + totals.skipped + totals.timedOut`
  equals `totals.total`.

## Failure handling

- If Playwright itself crashes, emit `BLOCKED` and capture the exit code.
- If a single test fails, mark that test `failed` and continue.

## Dependencies

- The Playwright framework.
- A PASS or PASS WITH WARNINGS verdict from `test-automation-reviewer`.
- Consumed by `bug-reporting` (if failures).
