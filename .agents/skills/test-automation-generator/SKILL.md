---
name: test-automation-generator
description: Generate a Playwright TypeScript spec file from an approved test case. Produces an executable spec under automation/tests/ that the reviewer and executor skills consume.
---

# Skill: test-automation-generator

## Purpose

Generate a Playwright TypeScript spec file from an approved test case.

## When to use

- User asks to "automate TC-LOGIN-001", "write the automation for this
  test", "convert manual test into code".

## Inputs

| Name           | Required | Description                                   |
| -------------- | -------- | --------------------------------------------- |
| `testCaseId`   | yes      | e.g. `LOGIN-001`.                             |
| `testCasePath` | yes      | Path to the test case JSON.                   |
| `pageObjects`  | yes      | Existing page objects in `automation/pages/`. |

## Required context

- The selector cheatsheet: `.agents/agents/qa-agent/selector-cheatsheet.md`
- Existing page objects in `automation/pages/` and components in
  `automation/components/`.
- Existing fixtures in `automation/fixtures/`.
- Existing test data factories in `automation/test-data/`.
- The Playwright TypeScript config in `automation/tsconfig.json`.

## Workflow

1. Read the test case.
2. Identify the page objects needed. Do NOT create new page objects for
   one-off selectors — use page.locator() inside the spec.
3. Identify the test data needed. Use factories from
   `automation/test-data/` for dynamic data.
4. Decide:
   - For UI auth setup → use the `signedInAs` fixture.
   - For non-UI user setup → call `apiClient.signup()`.
5. Write the spec using `test.describe()`/`test()` from
   `@playwright/test`.
6. For each step:
   - Use a stable selector from the cheatsheet.
   - Use Playwright auto-waiting assertions, NOT `waitForTimeout`.
   - Group multiple UI changes with `expect.soft()` only when truly
     independent.
7. For modals, wait with `expect(modalLocator).toBeVisible()`.
8. For native alerts, register the dialog handler at the top of the
   test and assert on the captured message.
9. For SweetAlert on purchase, use `waitForSweetAlertAndAccept`.
10. Save the spec to `automation/tests/<feature>/<test-id>.spec.ts`.
11. Optionally copy a frozen copy of the spec to
    `artifacts/automation/<feature>/<test-id>.spec.ts` (timestamped).

## QA rules / heuristics

- NEVER use `waitForTimeout()`.
- NEVER use `nth()` unless it is the only option.
- NEVER hardcode credentials. Use factories.
- NEVER depend on test execution order.
- One `test()` per test case ID. Multiple test cases → multiple `test()`
  blocks in one `describe`.
- Use TypeScript `satisfies` or explicit types where helpful.
- Use fixtures for shared setup. Use `test.beforeEach` only for setup that
  applies to ALL tests in the file.

## Output format

TypeScript file at `automation/tests/<feature>/<test-id>.spec.ts`.

Recommended structure:

```ts
import { test, expect } from '../../fixtures/baseFixture';
import { HomePage } from '../../pages/HomePage';
import { LoginModal } from '../../pages/LoginModal';

test.describe('Login — LOGIN-001', () => {
  test('User logs in with valid credentials', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.openLoginModal();

    const modal = new LoginModal(page);
    await modal.login('qa_user_001', 'P@ssw0rd!qa');

    await expect(page.locator('#nameofuser')).toContainText('Welcome qa_user_001');
  });
});
```

## Validation rules

- File exists at `automation/tests/<feature>/<test-id>.spec.ts`.
- Imports from `../../fixtures/baseFixture`.
- Uses page objects, not raw locators where a page object exists.
- At least one `expect(...)` assertion.
- No `waitForTimeout(` in the file (regex allowed).
- No hardcoded credentials that look real (regex against common patterns).

## Failure handling

- If the test case cannot be automated (e.g., requires manual-only
  verification), mark `automationCandidate: false` in the test case and
  refuse to generate code. Add an open question to the test case.

## Dependencies

- The test case artifact (produced by `test-case-writing`).
- The Playwright framework + page objects + fixtures.
- Consumed by `test-automation-reviewer` and `test-automation-execution`.
