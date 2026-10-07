---
name: test-case-execution
description: Manually reproduce a test case against the live Demoblaze application and capture PASS / FAIL / BLOCKED with evidence. Produces a JSON execution artifact.
---

# Skill: test-case-execution

## Purpose

Manually reproduce a test case against the live application and capture
PASS / FAIL / BLOCKED with evidence.

## When to use

- User asks to "execute TC-XYZ", "manually reproduce the bug", "run the
  login test case by hand".

## Inputs

| Name           | Required | Description                                       |
| -------------- | -------- | ------------------------------------------------- |
| `testCaseId`   | yes      | e.g. `LOGIN-001`.                                 |
| `testCasePath` | yes      | Path to the test case in `artifacts/test-cases/`. |

## Required context

- The selector cheatsheet: `.claude/agents/qa-agent/selector-cheatsheet.md`
- The verified dialog handler utility: `automation/utils/dialogHandler.ts`
- A running Playwright browser (or any browser automation tool)
- The application URL from `.env` (`DEMOBLAZE_BASE_URL`)

## Workflow

1. Read the test case from `artifacts/test-cases/<feature>.json`.
2. Resolve preconditions: create the user via API helper if needed.
3. Reset cookies/localStorage so the run is independent.
4. Navigate to the base URL.
5. Execute each step literally. Use the **stable selectors** in the
   cheatsheet — do not invent new selectors.
6. Register the native-dialog handler **before** any step that may
   produce an alert.
7. Capture the **actual result** for each step.
8. Capture the **final outcome** at the end:
   - PASS: expected result observed
   - FAIL: expected result NOT observed
   - BLOCKED: prerequisite could not be set up
9. Save a screenshot on FAIL.
10. Write the execution artifact.

## QA rules / heuristics

- Do NOT modify the test case file. Ever.
- Do NOT skip steps. If a step cannot be executed, mark BLOCKED and
  explain.
- Capture the exact alert() message via the dialog handler.
- Capture the page URL at the moment of failure.
- Capture any visible error text near the failure point.

## Output format

JSON file at `artifacts/test-executions/<execution-id>.json`.

`<execution-id>` = `<testCaseId>-<YYYY-MM-DDTHH-MM-SS>`.

```json
{
  "executionId": "LOGIN-001-2026-10-08T12-30-00",
  "testCaseId": "LOGIN-001",
  "feature": "login",
  "executedAt": "<ISO-8601>",
  "executor": "qa-agent",
  "environment": {
    "baseUrl": "https://www.demoblaze.com",
    "browser": "chromium",
    "headless": false
  },
  "status": "PASS|FAIL|BLOCKED",
  "steps": [
    { "index": 1, "action": "Navigate to /", "actual": "Loaded https://www.demoblaze.com/", "ok": true },
    ...
  ],
  "expectedResult": "Modal closes; navbar shows 'Welcome <username>' and 'Log out'.",
  "actualResult": "...",
  "evidence": {
    "screenshotPath": "artifacts/test-executions/LOGIN-001-.../screenshot.png",
    "pageUrl": "https://www.demoblaze.com/",
    "alertMessage": null,
    "consoleErrors": []
  },
  "notes": ""
}
```

## Failure handling

- If the precondition cannot be set up (e.g., the API is unreachable),
  emit `BLOCKED` and record why.
- If a step fails, continue recording but mark `ok: false` for that step.

## Dependencies

- The test case artifact (produced by `test-case-writing`).
- The Playwright framework + dialog handler.
