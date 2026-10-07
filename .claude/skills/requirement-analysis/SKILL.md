---
name: requirement-analysis
description: Analyze a feature description, user story, or acceptance criteria and produce a structured requirement document. Use this as the first step in the QA pipeline.
---

# Skill: requirement-analysis

## Purpose

Analyze a feature description, user story, or acceptance criteria and produce
a structured requirement analysis that downstream skills can consume.

## When to use

- User asks to "analyze the login requirement", "what scenarios should we
  cover for X", "give me a checklist for feature Y".
- This is typically the first skill in `full-pipeline`.

## Inputs

| Name                     | Required | Description                                          |
| ------------------------ | -------- | ---------------------------------------------------- |
| `feature`                | yes      | A short slug, e.g. `login`, `signup`, `place-order`. |
| `description`            | yes      | Raw feature text (free form).                        |
| `knownSelectableTargets` | no       | Pre-discovered UI surfaces (optional).               |

## Required context

- The target application: `https://www.demoblaze.com/`
- The selector cheatsheet: `.claude/agents/qa-agent/selector-cheatsheet.md`
- Existing requirement artifacts in `artifacts/requirements/` (if any, to
  avoid duplication)

## Workflow

1. Identify the primary capability being delivered.
2. List **functional requirements** (the system must…).
3. List **business rules** (constraints, policies).
4. List **preconditions** (state the system must be in before the feature
   can be exercised).
5. Enumerate:
   - **Positive scenarios** (happy path variants)
   - **Negative scenarios** (invalid inputs, unauthorized users, errors)
   - **Boundary cases** (limits, empty, max length, just-in/just-out)
   - **Edge cases** (concurrent, race, partial state, recovery)
6. Capture **risks** (areas likely to be flaky, areas with low confidence).
7. Capture **assumptions** made about the application behavior.
8. Capture **open questions** (things you cannot determine from the
   description alone).
9. Derive **testable acceptance criteria** — each one must be a single
   sentence that can be turned into a test.

## QA rules / heuristics

- NEVER invent UI text. If the requirement description does not specify
  a label or message, write "to be verified" and add an open question.
- Prefer 1 sentence per requirement. Long sentences block.
- Always include at least 2 negative scenarios and 1 boundary case.
- Open questions are required when the description is ambiguous.
- Avoid duplicating testable acceptance criteria with scenarios. Scenarios
  describe what a user can do; AC describes what the system MUST do.

## Output format

A Markdown file at `artifacts/requirements/<feature>.md` with these
sections (in order):

1. `# Feature: <feature>`
2. `## Requirement Summary` — 2–4 sentences
3. `## Functional Requirements` — bullet list
4. `## Business Rules` — bullet list
5. `## Preconditions` — bullet list
6. `## Positive Scenarios` — bullet list
7. `## Negative Scenarios` — bullet list
8. `## Boundary Cases` — bullet list
9. `## Edge Cases` — bullet list
10. `## Testable Acceptance Criteria` — bullet list
11. `## Risks` — bullet list
12. `## Assumptions` — bullet list
13. `## Open Questions` — bullet list

## Validation rules

- File exists at `artifacts/requirements/<feature>.md`.
- Contains the sections listed above.
- Has at least 3 functional requirements and 2 acceptance criteria.
- Has at least 2 negative scenarios.

## Failure handling

- If the description is too short to analyze, ASK the user for more
  details instead of guessing.
- If the target is not Demoblaze, state the assumption and stop.

## Examples

Example invocation:

User: "Analyze the login requirement."

Expected output sections (abbreviated):

```markdown
# Feature: login

## Requirement Summary

The login feature lets a registered user authenticate against Demoblaze
and gain access to user-only actions (logout, cart tied to a session).

## Functional Requirements

- The system MUST accept username and password via the Log in modal.
- The system MUST validate credentials against the demoblaze API.
  ...

## Negative Scenarios

- Wrong password — system alerts "Wrong password."
- Unknown user — system alerts "User does not exist."
  ...

## Boundary Cases

- Empty username or empty password — system alerts "Please fill out
  Username and Password."
```

## Dependencies

- None (this is the entry-point skill).
