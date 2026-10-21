# Demoblaze QA Agent — Skills-Based QA Framework

A reusable **Single Agent + Multi-Skill** QA framework that exercises
[Demoblaze](https://www.demoblaze.com/) end-to-end through the seven canonical
QA activities: requirement analysis → test case writing → test case execution →
test automation generation → test automation review → test automation execution
→ bug reporting.

The framework is organized around the **Agent Skills** convention
(`.agents/agents/<name>/agent.md` + `.agents/skills/<name>/SKILL.md`).
The agent contract is **harness-agnostic**: any agent host that can read
markdown and invoke tools (Claude Code, puku-cli, Cursor, Codex, a custom
runner, etc.) can execute it. The included `scripts/run-agent.ts` is one
such host.

The framework is designed so that a future migration to a **Multi-Agent +
Multi-Skill + Orchestrator** architecture is a routing change, not a rewrite.

---

## 1. Project purpose

Most QA frameworks are either "a Playwright test suite" or "a pile of LLM
prompts". This project is neither. It is a **skills-based QA system** in which:

- One **QA Agent** (a single decision-maker) classifies a natural-language
  request and selects the right **skill(s)** to satisfy it.
- Each **skill** is a self-contained `SKILL.md` describing one QA activity
  (input, output, workflow, rules, validation).
- **Tools** are the actual side-effecting code (Playwright, fetch, file
  writers) — never embedded in skills.
- **Artifacts** are the explicit contract between skills: requirements,
  test cases, executions, automation reviews, bug reports.

The seven canonical skills map to the seven canonical QA activities. You can
invoke any one of them on its own, or let the agent chain them into a
full pipeline.

---

## 2. Architecture at a glance

```
┌──────────────────────┐
│   USER REQUEST       │  "Analyze login, write tests, automate, run, report"
└──────────┬───────────┘
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  QA AGENT  (.agents/agents/qa-agent/agent.md)                             │
│  - Reads intent, picks workflow, picks skills, validates artifacts.       │
│  - Harness-agnostic: any agent host can run it.                          │
└──────┬───────────────────────────────────────────────────────────────────┘
       │  loads
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SKILLS  (.agents/skills/*/SKILL.md) — pure markdown contracts           │
│   requirement-analysis → test-case-writing → test-case-reviewer →         │
│   test-automation-generator → test-automation-reviewer →                  │
│   test-automation-execution → bug-reporting                               │
└──────┬───────────────────────────────────────────────────────────────────┘
       │  emits / consumes
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ARTIFACTS  (artifacts/**)                                                │
│   requirements/*.md | test-cases/*.json | test-case-reviews/*.md |       │
│   test-executions/*.json | automation-reviews/*.md |                      │
│   bug-reports/*.md | execution-report.json                                │
└──────┬───────────────────────────────────────────────────────────────────┘
       │  consumed by tools
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PLAYWRIGHT FRAMEWORK  (automation/**)                                    │
│   pages/ | components/ | fixtures/ | test-data/ | utils/ | tests/        │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
   Browser  (Demoblaze)
```

### Agent vs Skill vs Tool vs Artifact

| Layer        | Lives in                 | Responsibility                                             |
| ------------ | ------------------------ | ---------------------------------------------------------- |
| **Agent**    | `.agents/agents/<name>/` | Reasoning, intent, skill selection, workflow orchestration |
| **Skill**    | `.agents/skills/<name>/` | Domain knowledge for ONE QA activity (input → output)      |
| **Tool**     | `automation/`            | Side-effecting code: Playwright, fetch, file writers       |
| **Artifact** | `artifacts/**`           | Structured output of a skill; contract between skills      |
| **Host**     | `scripts/`               | Optional CLI host that runs the agent deterministically    |

A skill does NOT contain application-specific selectors or page-object code.
Tools do not embed QA policy. The agent does not bypass skill contracts.

### Harness-agnostic design

The agent contract in `.agents/agents/qa-agent/agent.md`:

- Does **not** reference any specific harness or host tool API.
- Does **not** assume a specific model or `Skill` invocation primitive.
- Speaks in terms of **markdown contracts** and **artifacts** that any
  host can read and produce.

Any host that can do the following can run the agent:

1. Read `agent.md` as the system-level instruction.
2. Read each `SKILL.md` on demand.
3. Read & write the artifacts in `artifacts/`.
4. Invoke Playwright (via the `automation/` layer).
5. Enforce the agent's hard rules.

The included `scripts/run-agent.ts` is the reference host. Claude Code,
puku-cli, Cursor, a Make-driven bash loop, or a custom Node script can
all be hosts — the agent doesn't care.

---

## 3. Folder structure

```
demoblaze-qa-agent/
│
├── inputs/                                # USER-AUTHORED INPUTS (committed)
│   └── requirements/                       # one .md per feature
│       ├── README.md                       # authoring + discovery contract
│       └── login.md                        # example — feature slug "login"
│
├── .agents/                              # Agent Skills convention
│   ├── agents/
│   │   └── qa-agent/
│   │       ├── agent.md                  # identity, routing, hard rules
│   │       ├── intent-router.ts          # deterministic keyword router
│   │       ├── selector-cheatsheet.md    # verified selectors for Demoblaze
│   │       └── workflows/                # 5 workflow specs
│   │           ├── full-pipeline.md
│   │           ├── analyze-only.md
│   │           ├── design-only.md
│   │           ├── automate-and-execute.md
│   │           └── review-and-report.md
│   └── skills/                           # one folder per skill
│       ├── requirement-analysis/SKILL.md
│       ├── test-case-writing/SKILL.md
│       ├── test-case-reviewer/SKILL.md
│       ├── test-case-execution/SKILL.md
│       ├── test-automation-generator/SKILL.md
│       ├── test-automation-reviewer/SKILL.md
│       ├── test-automation-execution/SKILL.md
│       └── bug-reporting/SKILL.md
│
├── automation/
│   ├── playwright.config.ts
│   ├── tsconfig.json
│   ├── tests/
│   │   └── auth/
│   │       └── login.spec.ts             # 5 login cases, all passing
│   ├── pages/                            # one page object per surface
│   │   ├── HomePage.ts
│   │   ├── LoginModal.ts
│   │   ├── SignupModal.ts
│   │   ├── ContactModal.ts
│   │   ├── ProductPage.ts
│   │   ├── CartPage.ts
│   │   └── PlaceOrderModal.ts
│   ├── components/                       # reusable UI components
│   │   ├── Navbar.ts
│   │   └── ProductCard.ts
│   ├── fixtures/
│   │   └── baseFixture.ts                # extends test with dialog handler
│   ├── test-data/
│   │   └── users.ts
│   ├── utils/
│   │   ├── dialogHandler.ts              # native alert + SweetAlert
│   │   ├── apiClient.ts                  # bypass-UI signup helper
│   │   ├── testDataFactory.ts            # unique users, order data
│   │   └── helpers.ts                    # bootstrap modal, state reset
│   ├── types/
│   │   └── domain.ts                     # shared types
│   └── config/
│       └── environment.ts
│
├── artifacts/
│   ├── requirements/
│   │   └── login.md                      # produced by requirement-analysis
│   ├── test-cases/
│   │   └── login.json                    # produced by test-case-writing
│   ├── test-case-reviews/                # produced by test-case-reviewer
│   ├── test-executions/                  # produced by test-case-execution
│   ├── automation-reviews/               # produced by test-automation-reviewer
│   └── bug-reports/                      # produced by bug-reporting
│
├── scripts/                              # one possible host for the agent
│   ├── run-skill.ts                      # CLI: invoke a single skill
│   ├── run-agent.ts                      # CLI: run the QA Agent on a request
│   └── artifact-writers.ts               # typed artifact read/write
│
├── reports/                              # playwright html + json reports
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

---

## 4. How the QA Agent works

1. **Receive request** — natural language, e.g. "Test the login functionality".
2. **Classify intent** — see `.agents/agents/qa-agent/agent.md` and the routing
   rules in `.agents/agents/qa-agent/intent-router.ts`.
3. **Pick a workflow** — one of `analyze-only`, `design-only`,
   `automate-and-execute`, `review-and-report`, `full-pipeline`.
4. **Invoke skills in order**, providing each with the upstream artifact.
5. **Validate each artifact** before moving on. If a skill produces an
   invalid artifact, halt and report.
6. **Report** a concise summary back to the user.

Examples of routing:

| User says                                                        | Workflow               | Skills                                                                                                                                                  |
| ---------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Analyze the login requirement"                                  | `analyze-only`         | `requirement-analysis`                                                                                                                                  |
| "Write test cases for login"                                     | `design-only`          | `test-case-writing` → `test-case-reviewer`                                                                                                             |
| "Review the login test cases"                                    | `review-and-report`    | `test-case-reviewer`                                                                                                                                    |
| "Run the login automation"                                       | `automate-and-execute` | `test-automation-execution`                                                                                                                             |
| "Review this Playwright script"                                  | `review-and-report`    | `test-automation-reviewer`                                                                                                                              |
| "Analyze login, write tests, automate, run, and report failures" | `full-pipeline`        | `requirement-analysis` → `test-case-writing` → `test-case-reviewer` → `test-automation-generator` → `test-automation-reviewer` → `test-automation-execution` → `bug-reporting` |

The deterministic host `scripts/run-agent.ts` is a CLI that demonstrates
this routing in action.

---

## 5. How skills work

Each `SKILL.md` defines:

- **YAML frontmatter** — `name` and `description` so any host can index
  and load it on demand.
- **Purpose** — one sentence.
- **When to use** — explicit triggers.
- **Inputs** — typed table.
- **Required context** — files the skill assumes the agent has loaded.
- **Workflow** — numbered steps.
- **QA rules / heuristics** — what to always do, what to never do.
- **Output format** — file path + schema.
- **Validation rules** — what "valid" means.
- **Failure handling** — what to do on bad input.
- **Dependencies** — which upstream artifacts this skill expects.

Skills do **not** contain executable code or page-specific selectors. Those
live in the Playwright framework. The boundary is what makes skills
reusable across applications.

---

## 6. How artifacts move between skills

```
requirements/login.md
   (requirement-analysis)
        ↓
test-cases/login.json
   (test-case-writing)
        ↓
test-case-reviews/login-review.md
   (test-case-reviewer)  ── verdict PASS|PASS WITH WARNINGS|FAIL
        ↓ (PASS only)
automation/tests/auth/login.spec.ts
   (test-automation-generator)
        ↓
automation-reviews/login-review.md
   (test-automation-reviewer)  ── verdict PASS|PASS WITH WARNINGS|FAIL
        ↓ (PASS only)
reports/last-run.json
   (test-automation-execution) ── contains failures?
        ↓ (yes)
bug-reports/BUG-001-*.md
   (bug-reporting)
```

Every artifact is timestamped; **no skill mutates a downstream artifact**
(e.g. the test-case writer never edits an execution-result; the executor
never edits a test case).

---

## 7. Authoring requirements

Requirement files live under `inputs/requirements/`. **You do not need
to paste requirement content or file paths into chat** — the QA Agent
auto-discovers the right file from your natural-language request.

### Workflow

```
inputs/requirements/login.md        # you author this
        ↓ (you say "Analyze login")
QA Agent
        ↓
requirement-analysis skill
        ↓ reads the file
artifacts/requirements/login.md     # generated, with ## Source provenance
```

### Add a new requirement

1. Create `inputs/requirements/<feature-slug>.md`. Filename **is** the
   feature slug.
2. Use the structure documented in `inputs/requirements/README.md`:
   `# <Feature Name>` + `## Requirement` + `## Acceptance Criteria`.
3. Commit it. The file is now part of the project's source of truth.
4. Trigger the agent naturally: `"Analyze <feature>"`,
   `"Write test cases for <feature>"`, or
   `"Automate <feature>"`.

### Resolution rules (summary)

| You say                                  | The agent finds                                |
| ---------------------------------------- | ---------------------------------------------- |
| `"Analyze login"`                        | `inputs/requirements/login.md`                 |
| `"Write test cases cart"`                | `inputs/requirements/cart.md`                  |
| `"Automate signup"`                      | `inputs/requirements/signup.md`                |
| `"process inputs/requirements/login.md"` | uses that file (explicit override)             |
| `"Analyze ghost-feature"` (no match)     | lists available files, falls back to free-text |

When multiple files match, the agent halts and asks you to pick.

### Compatibility with existing flows

Free-text descriptions in chat still work as a fallback. The host CLI
auto-detects when a requirement file applies and passes its path via
`--source=` to the skill.

---

## 8. Install

Requirements: Node ≥ 20, npm ≥ 10.

```bash
# Clone and enter
cd "demoblaze single agent multi skill"

# Install dependencies
npm install

# Install Playwright browsers (Chromium)
npx playwright install chromium

# Copy env template
cp .env.example .env
# Edit .env if you need to override DEMOBLAZE_BASE_URL or HEADLESS.
```

---

## 9. Run the Playwright tests

```bash
# Run all tests (headless)
npm test

# Run smoke tests only
npm run test:smoke

# Run a specific test by id
npx playwright test --config=automation/playwright.config.ts --grep "LOGIN-001"

# Run with browser visible
HEADLESS=false npm test

# Open the HTML report after a run
npm run test:report
```

The 5 currently implemented Login tests cover:

| Test ID   | Scenario                             | Priority | Type       |
| --------- | ------------------------------------ | -------- | ---------- |
| LOGIN-001 | Valid credentials succeed            | P0       | functional |
| LOGIN-002 | Logout returns to logged-out state   | P0       | state      |
| LOGIN-003 | Wrong password shows alert           | P1       | negative   |
| LOGIN-004 | Unknown user shows alert             | P1       | negative   |
| LOGIN-005 | Empty form shows alert (no API call) | P1       | validation |

Expected runtime: ~50 seconds (sequential). The default config uses
`workers: 1` because Demoblaze's `/login` and `/signup` APIs are
informally rate-limited.

---

## 10. Use the agent from any host

The agent contract is a markdown file. Any host can run it.

### 10a. Reference Node host (bundled)

```bash
# Deterministic intent router + plan (auto-resolves requirement files)
npm run agent:pipeline -- "Analyze the login requirement"
npm run agent:pipeline -- "Analyze login, write test cases, automate and run them"

# Single skill — the CLI prints the resolved --source path when applicable
npm run agent:skill -- requirement-analysis login
npm run agent:skill -- requirement-analysis login --source=inputs/requirements/login.md
npm run agent:skill -- test-case-writing login
npm run agent:skill -- test-case-reviewer login
npm run agent:skill -- test-automation-execution smoke
```

### 10b. As Claude / Claude Code

1. Open the project in Claude Code.
2. Load `.agents/agents/qa-agent/agent.md` as the system-level context.
3. On a user request, the host follows the routing rules and reads the
   matching `.agents/skills/<skill>/SKILL.md` files on demand.
4. Skills produce artifacts in `artifacts/`.

### 10c. As puku-cli / any other Claude-compatible agent

The contract is the same markdown. The host loads `agent.md`, loads
each `SKILL.md` on demand, executes the skill's workflow against the
artifacts, and validates the outputs.

### 10d. As a custom host

Write a host that:

1. Reads `agent.md` (system prompt).
2. Runs `intent-router.ts` to get a `RouteDecision`.
3. For each skill in the decision, reads `SKILL.md` and follows its
   Workflow + QA rules.
4. Writes/validates artifacts via `scripts/artifact-writers.ts`.

That host can be in any language — the contracts are markdown.

---

## 11. How to add a new skill

1. Create `.agents/skills/<skill-name>/SKILL.md` with YAML frontmatter
   (`name`, `description`) and all the standard sections (see any
   existing `SKILL.md` for the template).
2. The skill must NOT reference page objects, fixtures, or application-
   specific selectors. Speak in artifact terms.
3. If the skill needs a new artifact shape, add a writer to
   `scripts/artifact-writers.ts` and a type to
   `automation/types/domain.ts`.
4. Add the skill to the routing table in
   `.agents/agents/qa-agent/agent.md`.
5. Add the skill to the keyword list in
   `.agents/agents/qa-agent/intent-router.ts`.
6. If the skill is part of a multi-step workflow, add a workflow spec
   under `.agents/agents/qa-agent/workflows/`.

---

## 12. How to add a new agent (sub-agent evolution)

1. Create `.agents/agents/<agent-name>/agent.md` with YAML frontmatter
   (`name`, `description`) and its own routing table.
2. The sub-agent owns one or more skills from `.agents/skills/`.
3. The orchestrator (`.agents/agents/orchestrator/agent.md` in future)
   routes to sub-agents based on user intent.
4. The artifact contract is unchanged — sub-agents read/write the same
   `artifacts/` paths.

---

## 13. How to add a new page

1. Add a new file under `automation/pages/<PageName>.ts` extending
   nothing but using the page object pattern.
2. Use selectors from `.agents/agents/qa-agent/selector-cheatsheet.md`
   when available. If a new selector is needed, verify it against the
   live DOM and add it to the cheatsheet.
3. The page object should expose high-level actions (e.g. `login(user)`),
   not raw locators.
4. If the new page is part of a new feature, add a directory under
   `automation/tests/<feature>/` and at least one spec.

---

## 14. How to add a new test

1. Pick the test case ID from the corresponding
   `artifacts/test-cases/<feature>.json` file.
2. Open or create the spec under `automation/tests/<feature>/<test-id>.spec.ts`.
3. Import `test` and `expect` from `../../fixtures/baseFixture` (NOT from
   `@playwright/test`) so the dialog handler is always installed.
4. Use page objects for navigation and form interactions. Use raw
   `expect(...)` for assertions.
5. If the test requires a fresh user, use `createUser()` from
   `automation/utils/testDataFactory.ts`. For tests that need a user
   to exist but don't care about signup, call `signup(user)` from
   `automation/utils/apiClient.ts` instead of going through the UI.
6. Mark P0 happy-path tests with the `@smoke` tag for fast-feedback runs.

---

## 15. Evolving into a Multi-Agent architecture

The current implementation is intentionally a single decision-maker
(the QA Agent) over eight skills. When the framework needs to scale:

1. **Add an Orchestrator Agent** at
   `.agents/agents/orchestrator/agent.md` that holds the routing logic
   in the current `qa-agent/agent.md`. It does not own any QA work; it
   just picks sub-agents.
2. **Promote each skill cluster to a sub-agent**:
   - Requirement Agent → owns `requirement-analysis`
   - Test Design Agent → owns `test-case-writing` + `test-case-execution`
   - Test Design Review Agent → owns `test-case-reviewer`
   - Automation Agent → owns `test-automation-generator`
   - Review Agent → owns `test-automation-reviewer`
   - Execution Agent → owns `test-automation-execution`
   - Bug Agent → owns `bug-reporting`
3. **Skills stay as-is.** They are pure markdown contracts; agents
   invoke them through the same artifact I/O the current host uses.
4. **Workflows move** from the current
   `.agents/agents/qa-agent/workflows/*.md` to the Orchestrator Agent's
   decision logic.

The key design property that makes this migration cheap: **the boundary
between skills and the framework is the artifact**. No skill reaches
into Playwright; no Playwright code reaches into a skill. That boundary
survives a multi-agent migration.

---

## 16. Coding standards

- TypeScript with `strict: true`.
- ESM modules (`"module": "ESNext"`).
- ESLint with `@typescript-eslint`.
- Prettier for formatting.
- No `waitForTimeout()`.
- No hardcoded credentials — use factories and `.env`.
- No `nth()` locators without justification.
- Page objects expose actions, not locators.
- One `test()` per test case ID. Multiple cases in one `describe` are fine.

---

## 17. Configuration reference

`.env` (or `.env.example` template):

| Variable             | Default                     | Purpose                                |
| -------------------- | --------------------------- | -------------------------------------- |
| `DEMOBLAZE_BASE_URL` | `https://www.demoblaze.com` | Base URL for tests                     |
| `DEMOBLAZE_API_URL`  | `https://api.demoblaze.com` | Used by the API client (signup helper) |
| `HEADLESS`           | `true`                      | `true` / `false`                       |
| `CI`                 | `false`                     | Enables retries and 1 worker           |
| `DEFAULT_TIMEOUT`    | `15000`                     | Per-test timeout in ms                 |

---

## 18. Known limitations

- **Third-party rate limiting**: Demoblaze's auth APIs are informally rate
  limited. The config uses `workers: 1` to avoid triggering it.
- **Network flakiness**: Network-level failures (5xx) on `/login` or
  `/signup` may manifest as timeouts. Increase `DEFAULT_TIMEOUT` or add
  `retries` if you see this in CI.
- **Single browser**: Only Chromium is configured. Adding Firefox or
  WebKit is straightforward — add a project to `playwright.config.ts`.
- **Manual reproduction skill is scaffolded but not wired to a runner.** It
  produces an execution JSON via the dialog handler; a full manual
  reproduction flow would need a separate CLI step.
