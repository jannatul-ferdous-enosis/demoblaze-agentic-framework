# Workflow: automate-and-execute

For requests like: "automate the smoke tests and run them".

## Phases

1. **test-case-reviewer** (must be PASS or PASS WITH WARNINGS; skipped
   only if the test-cases artifact has already been reviewed and an
   existing verdict artifact is present)
2. **test-automation-generator**
3. **test-automation-reviewer** (must be PASS or PASS WITH WARNINGS)
4. **test-automation-execution**
5. **bug-reporting** (if failures)

Halt on review FAIL.
