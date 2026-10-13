# Workflow: analyze-only

For requests like: "analyze the login requirement", "what test scenarios
should we cover for X".

## Pre-phase: requirement resolution

Before invoking the skill, the agent runs requirement resolution (see
`agent.md` → "Requirement resolution"):

- If a file in `inputs/requirements/<feature>.md` is discovered (or the
  user cited an explicit path), set `requirementSourcePath` to it.
- If no file is found, fall back to a chat-supplied `description` (or
  ASK the user for one).

## Phases

1. **requirement-analysis**
   - Inputs: `feature` (required), and EITHER `description` OR
     `requirementSourcePath` (one required; `requirementSourcePath`
     wins when both are present).
   - Output: `artifacts/requirements/<feature>.md`. Must include a
     `## Source` section if `requirementSourcePath` was used.
   - Validation: file exists; contains the 13 ordered sections; ≥3
     functional requirements; ≥2 acceptance criteria; ≥2 negative
     scenarios; `## Source` provenance when applicable.

Halt after the requirement artifact is validated.
