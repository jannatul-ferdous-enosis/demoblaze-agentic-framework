# Inputs — Requirements

This folder contains **user-authored QA requirements**. They are the
**first-class input source** for the entire QA pipeline.

```
inputs/requirements/
├── README.md         # this file — authoring + discovery contract
├── login.md          # example — feature slug: "login"
├── signup.md         # future
├── cart.md           # future
└── checkout.md       # future
```

## What this folder is

- **Source of truth** for product/feature requirements.
- Version-controlled in git (unlike `artifacts/`, which is generated and
  gitignored).
- Read by the QA Agent. The agent NEVER writes here.
- Separate from skills, artifacts, automation, reports, and scripts.

## What this folder is NOT

- Not a place for test cases, automation code, or execution results.
- Not edited by any skill. Skills write to `artifacts/`.
- Not optional. When a request targets `requirement-analysis` or
  `test-case-writing`, the agent looks here first.

---

## Authoring contract

### File naming

- **One file per feature**.
- **Filename (without `.md`) IS the feature slug**. Example:
  `login.md` → feature slug `login`, which maps to
  `artifacts/requirements/login.md` and
  `artifacts/test-cases/login.json`.

### Required markdown structure

Each file MUST contain at least:

```markdown
# <Feature Display Name>

## Requirement

<One paragraph describing what the system must do.>

## Acceptance Criteria

- <Observable, testable criterion.>
- <Observable, testable criterion.>
```

### Authoring rules

- Use **imperative voice** in acceptance criteria ("User can open the
  login form" — not "The login form should be openable").
- Each AC must be **observable** — something a tester or Playwright
  assertion can verify.
- Each AC should be **single-sentence** and **single-behavior**.
- **Do not invent UI text.** If the spec doesn't say "Log in" vs
  "Sign in", write `"to be verified"` and let the requirement-analysis
  skill flag it as an open question.
- Prefer 3–8 acceptance criteria. More is fine; less usually isn't.
- Optional sections are welcome: `## Notes`, `## Out of scope`,
  `## References`. They are passed through to the requirement-analysis
  skill as additional context.

---

## Discovery contract (how the agent finds the right file)

You do **not** need to cite the file path in chat. The agent resolves it
automatically from your natural-language request.

### Examples

| You say                     | The agent finds                              |
| --------------------------- | -------------------------------------------- |
| "Analyze login"             | `inputs/requirements/login.md`               |
| "Write test cases for cart" | `inputs/requirements/cart.md`                |
| "Automate signup"           | `inputs/requirements/signup.md`              |
| "Run the checkout pipeline" | (no requirement file needed; pure execution) |

### Resolution rules (in order)

1. **Explicit path override** — if your request contains a quoted or
   backticked `.md` path (e.g. `process inputs/requirements/login.md`),
   the agent uses it. This is for advanced cases.
2. **Exact slug match** — the feature name in your request matches a
   filename exactly. `"login"` → `login.md`.
3. **Slug contains / contained-in** — partial matches (e.g. `cart` →
   `add-to-cart.md`).
4. **Heading match** — the file's H1 (`# Login Feature`) contains the
   feature name.
5. **Fuzzy match** — close spellings (Levenshtein ≤ 2).
6. **No match** — the agent lists the available files and asks which
   one you meant. If no file fits, it falls back to free-text mode
   (you paste the requirement in chat).

### When the agent asks for clarification

If multiple files match (e.g. you say `"login"` and both `login.md`
and `login-v2.md` exist), the agent halts and presents the candidates.
Reply with the file name (or the full path) to disambiguate.

---

## Adding a new requirement

1. Create `inputs/requirements/<feature-slug>.md` using the structure
   above.
2. Commit it. The file is now part of the project's source of truth.
3. Trigger the agent with a natural-language request (e.g. `"Analyze
<feature-slug>"`). The agent will read your file, run
   `requirement-analysis`, and produce `artifacts/requirements/<feature-slug>.md`.

You never need to paste the requirement content into chat.
