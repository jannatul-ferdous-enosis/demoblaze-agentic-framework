---
name: bug-reporting
description: Convert a failed execution into a professional, evidence-driven bug report. Produces a Markdown file under artifacts/bug-reports/.
---

# Skill: bug-reporting

## Purpose

Convert a failed execution into a professional, evidence-driven bug report.

## When to use

- After a test execution fails.
- User asks to "log a bug from this failure", "create a defect report".

## Inputs

| Name                  | Required | Description                                 |
| --------------------- | -------- | ------------------------------------------- |
| `executionReportPath` | yes      | The `reports/last-run.json`.                |
| `failedTestIds`       | no       | Defaults to all failed tests in the report. |
| `evidenceDir`         | no       | Path to screenshots/traces.                 |

## Required context

- The selector cheatsheet: `.agents/agents/qa-agent/selector-cheatsheet.md`
- The originating test case (looked up via the failed test ID).

## Workflow

1. Read the execution report.
2. For each failed test, look up the originating test case.
3. Combine evidence:
   - Test case: preconditions, steps, expected result
   - Execution: actual result, error message, screenshot path, trace path
4. Compose a single bug report per failure.
5. Title must be specific and descriptive — NOT "Login not working" /
   "Test failed".
6. Severity mapping:
   - P0 test failed in primary happy path → Severity `High`
   - P1 test failed → `Medium`
   - P2 test failed → `Low`
7. Reproducibility: `Always` if test failure is deterministic, `Sometimes`
   if flaky (multiple retries needed), `Rare` if only intermittent.
8. Write the bug report.

## QA rules / heuristics

- NEVER invent facts. Use only what is in the execution report and the
  test case.
- NEVER speculate about a cause — only describe observed behavior.
- The title must mention the specific feature surface.
- Steps to Reproduce MUST follow the test case steps verbatim.
- Actual Result MUST be a quote from the execution evidence (assertion
  message, captured alert text, observed DOM text).
- Expected Result MUST be the test case's `expectedResult` verbatim.

## Output format

Markdown file at `artifacts/bug-reports/BUG-<NNN>-<slug>.md`.

`<NNN>` is a zero-padded 3-digit sequential ID per repo.
`<slug>` is a short kebab-case summary, e.g. `login-wrong-password-no-alert`.

Required sections:

```markdown
# BUG-001: <short title>

| Field                   | Value                                |
| ----------------------- | ------------------------------------ |
| Bug ID                  | BUG-001                              |
| Title                   | <short title>                        |
| Feature                 | <feature>                            |
| Severity                | High\|Medium\|Low                    |
| Priority                | P0\|P1\|P2                           |
| Reproducibility         | Always\|Rare\|Sometimes              |
| Environment             | chromium @ https://www.demoblaze.com |
| Related Test Case       | <testCaseId> — <testCasePath>        |
| Related Automation Test | <spec path>                          |
| Reported At             | <ISO-8601>                           |

## Preconditions

<bullet list>

## Steps to Reproduce

1. <step>
2. ...

## Expected Result

<verbatim from test case>

## Actual Result

<verbatim from execution evidence>

## Evidence

- Screenshot: <path>
- Trace: <path>
- Alert captured: "<message>" (or n/a)
- Page URL at failure: <url>

## Notes

<optional — anything else observed, e.g. console errors>
```

## Validation rules

- File exists.
- All required fields are populated.
- Title is at least 10 characters long and contains the feature name.
- Expected Result and Actual Result are non-empty.
- Steps to Reproduce has at least 3 steps (unless the test case legitimately
  has fewer — link to it instead).

## Failure handling

- If the test case for a failed test ID cannot be found, write the bug
  report but leave `Related Test Case` as "UNKNOWN" and add a note.

## Dependencies

- An execution report from `test-automation-execution`.
- The originating test case.
