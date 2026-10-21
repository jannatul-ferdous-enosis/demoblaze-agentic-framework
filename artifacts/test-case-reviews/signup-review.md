# Review: signup

**Verdict:** PASS WITH WARNINGS
**Feature:** signup
**Test Case File:** artifacts/test-cases/signup.json
**Requirement Artifact:** artifacts/requirements/signup.md
**Reviewed at:** 2026-10-22T00:00:00.000Z

## Summary

The signup test case artifact is structurally sound, traceable, and
executable as written. All 11 cases parse, IDs are unique, all required
fields are populated, and stable selectors (Sign up navbar link, Sign up
modal inputs, alert messages) match the verified Demoblaze selector
cheatsheet. Coverage maps the requirement artifact's happy path,
auto-login (or absence thereof), duplicate-user failure, empty-field
guards, allowed-character acceptance, modal-exclusive behavior, and
dialog-handler regression. Two compound steps and one non-UI-observable
expected result produce minor / major findings — they do not block
automation but should be tightened up before final sign-off.

## Schema & Structural Correctness

- File parses as valid JSON. ✓
- `feature`, `version`, `generatedAt`, `sourceArtifact`, `cases[]` all
  present. ✓
- 11 cases (well below the ~20 case heuristic). ✓
- Every case has all required fields: `id`, `feature`, `scenario`,
  `priority`, `type`, `steps`, `expectedResult`, `automationCandidate`. ✓
- Every case's `steps[]` is non-empty. ✓
- IDs are unique and follow `SIGNUP-<NNN>` pattern. ✓
- All `priority` values are P0/P1/P2. ✓
- All `type` values are in the allowed set
  (`functional`, `negative`, `boundary`, `validation`, `state`,
  `regression`). ✓
- `automationCandidate` is a boolean for every case. ✓

## Executability

- Steps are single actions in the majority of cases. See Findings
  #1 (SIGNUP-003 step 5 — compound "click + dismiss alert") and #2
  (SIGNUP-008 step 4 — ambiguous "Close" button).
- No vague timing steps (no "wait a bit", "wait for loading"). ✓
- All selector references map to stable cheatsheet entries:
  - "Sign up" in navbar → `#signin2`
  - Username/Password fields → `#sign-username`, `#sign-password`
  - "Sign up" button → modal submit button (by role)
  - Alert messages → verified exact strings
- No case requires both opening AND closing a modal except SIGNUP-001
  via alert dismissal and SIGNUP-008 explicitly. Other cases keep
  the modal state implicit at end (acceptable when state is asserted
  in `expectedResult`).
- Every alert-bearing case uses verified alert strings from the
  cheatsheet. ✓

## Expected Result Quality

- Most expected results are single, observable outcomes. ✓
- SIGNUP-002 references `#nameofuser` (welcome text) — verified. ✓
- SIGNUP-005 mentions "no signup API request is made" — observable in
  Playwright via network request interception but not via DOM assertion
  alone. Tracking as MINOR.
- SIGNUP-004's "no duplicate account is created" is **not** directly
  observable from the UI in a single test run (would require querying
  the signup API or running a second signup attempt later). Tracking
  as MAJOR.

## Coverage Traceability

Requirement → case mapping:

| Requirement scenario                                            | Case(s)                       |
| --------------------------------------------------------------- | ----------------------------- |
| Happy path: brand-new signup succeeds                           | SIGNUP-001 (P0 functional)    |
| Can immediately log in after signup                             | SIGNUP-002 (P0 state)         |
| Signup does NOT auto-authenticate                               | SIGNUP-003 (P0 state)         |
| Negative: username already exists                               | SIGNUP-004 (P1 negative)      |
| Negative: empty username / empty password                       | SIGNUP-005/006/007 (P1+P2 validation) |
| Functional: close modal without submitting                      | SIGNUP-008 (P2 functional)    |
| Boundary: allowed character classes for username and password   | SIGNUP-009 (P2 boundary)      |
| State: Sign up / Log in modal exclusivity                       | SIGNUP-010 (P2 state)         |
| Regression: dialog handler catches signup alerts                | SIGNUP-011 (P1 regression)    |

- All positive scenarios have at least one `functional` test case. ✓
- All negative scenarios have at least one `negative` or `validation`
  test case. ✓
- Boundary cases have at least one `boundary` test case. ✓
- Feature mutates session/auth state — at least one `state` test case
  included (SIGNUP-002, SIGNUP-003, SIGNUP-010). ✓
- IDs are unique within the file and there is no collision with the
  existing `login` feature (`LOGIN-001…005`). ✓

## Prioritization & Candidate Fitness

- Multiple P0 cases for the primary happy path and state correctness. ✓
- All P0/P1 cases have `automationCandidate: true`. ✓
- No case is marked `automationCandidate: false`, which is correct
  because every case maps to a stable Playwright assertion
  (DOM + dialog). ✓
- Within the ~20-case heuristic. ✓

## De-duplication

- SIGNUP-005 / SIGNUP-006 / SIGNUP-007 are differentiated by which
  field is empty (both/username-only/password-only). ✓
- SIGNUP-001 (happy path) and SIGNUP-009 (allowed characters) are
  similar but different in intent and `type`. ✓
- No exact-duplicate cases. ✓

## Maintainability

- `testData` is provided where the step needs specific values
  (username/password). ✓
- `preconditions` are explicit (e.g. SIGNUP-001 requires unique
  username + no `tokenp_` cookie; SIGNUP-004 requires duplicate user
  to exist). ✓
- `notes` field is used for non-obvious context (dialog-handler
  pre-condition, exact alert wording, regression rationale). ✓
- `sourceArtifact` references the originating requirement file. ✓

## Findings

| #  | Severity | Area              | Problem                                                                                          | Recommendation                                                                                  |
| -- | -------- | ----------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1  | MINOR    | Executability     | SIGNUP-003 step 5 chains two actions: "Click 'Sign up' and dismiss the success alert".            | Split into: (a) "Click 'Sign up' in the modal", (b) "Dismiss (accept) the success alert".       |
| 2  | MINOR    | Executability     | SIGNUP-008 step 4 says "Click 'Close' on the modal header (X)" — Bootstrap modals have both a header X and a footer Close; selector is ambiguous. | Use the cheatsheet's modal-scoped `getByRole('button', { name: 'Close' })` or scope to the header explicitly. |
| 3  | MINOR    | Expected Result   | SIGNUP-005 expected result claims "no signup API request is made" — observable in Playwright only via network request listening. | Either drop the network-absence assertion or note in `notes` that it requires `page.on('request')` interception. |
| 4  | MAJOR    | Expected Result   | SIGNUP-004 expected result claims "no duplicate account is created" — this cannot be observed from the UI in a single test run without API verification. | Either delete the side assertion, or convert it into a two-step case: "after rejection, attempt to register the same user again — second attempt also rejects". The simpler fix: remove "no duplicate account is created" from the inline expected result and move it to `notes` as a follow-up cross-check. |
| 5  | MINOR    | Coverage          | The requirement artifact's open question on username case-sensitivity has no corresponding test case. | Defer until open question is resolved; either label this case for manual investigation or add a TBV-tagged case. |
| 6  | INFO     | Maintainability   | SIGNUP-002 step 1 references "see SIGNUP-001" — this couples the cases. | Acceptable for now since both share the same scenario; consider a shared setup helper in the automation layer (`automation/fixtures/signup.ts`). |

## Verdict Justification

- 0 BLOCKER findings.
- 1 MAJOR finding (#4) — by the rules the verdict must be FAIL if
  there are ≥2 MAJOR findings. With only 1 MAJOR and several MINOR,
  the verdict is **PASS WITH WARNINGS**.

The artifact is approved to proceed to `test-automation-generator`
with findings #1–#4 to be addressed during automation code generation
where possible (e.g. add network interception, use scoped Close
selector, split compound steps). Finding #5 should be resolved by a
follow-up requirement-analysis pass once the case-sensitivity
question is settled.
