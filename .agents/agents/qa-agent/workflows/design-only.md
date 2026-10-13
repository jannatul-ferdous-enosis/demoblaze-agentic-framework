# Workflow: design-only

For requests like: "write test cases for login", "design tests for X".

## Note

This workflow consumes `artifacts/requirements/<feature>.md`. If the
user has only authored a file in `inputs/requirements/<feature>.md`
and has not yet run `analyze-only`, this workflow will fail with a
clear "no requirement artifact found" error.

To bootstrap, the user should either:

1. Run `analyze-only` first (e.g. `"Analyze <feature>"`), OR
2. Ask for `full-pipeline`, which handles analysis first.

If the user's request is `"write test cases for <feature>"` and a file
exists in `inputs/requirements/<feature>.md`, the agent MAY chain
`analyze-only` + `design-only` automatically.

## Phases

1. **test-case-writing**
   - Input: existing requirement artifact at
     `artifacts/requirements/<feature>.md` OR raw description from
     user.
   - Output: `artifacts/test-cases/<feature>.json`

Halt after the test-cases artifact is validated.
