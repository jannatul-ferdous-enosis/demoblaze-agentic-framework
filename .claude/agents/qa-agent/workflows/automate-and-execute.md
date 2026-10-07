# Workflow: automate-and-execute

For requests like: "automate the smoke tests and run them".

## Phases

1. **test-automation-generator**
2. **test-automation-reviewer** (must be PASS or PASS WITH WARNINGS)
3. **test-automation-execution**
4. **bug-reporting** (if failures)

Halt on review FAIL.
