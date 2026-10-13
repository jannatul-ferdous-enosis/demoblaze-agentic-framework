# scripts/

Host-side CLI entry points and deterministic helpers for the QA Agent. These scripts are the typed, testable implementation of the workflows described in `.agents/agents/qa-agent/agent.md` and the per-skill `SKILL.md` files under `.agents/skills/`.

> The LLM-backed reasoning still happens inside the agent host. These scripts handle everything that *can* be done deterministically: argument parsing, file discovery, scoring, skeleton generation, and printing the next command to run.

## Files

### `run-agent.ts` — end-to-end pipeline driver

```bash
tsx scripts/run-agent.ts "Analyze the login requirement"
tsx scripts/run-agent.ts "Run the login smoke tests"
tsx scripts/run-agent.ts "Analyze login, write test cases, automate, run, and report"
```

What it does, in order:

1. **Routes the request** via the intent router (`.agents/agents/qa-agent/intent-router.ts`) → `{ workflow, skills[], rationale }`.
2. **Resolves a requirement file** when the request targets the requirement pipeline or cites an explicit `.md` path. See `requirement-resolver.ts` below.
3. **Prints the planned workflow** (workflow name, ordered skill list, rationale).
4. **Per skill**, prints the deterministic next command:
   - `requirement-analysis` → `npm run agent:skill -- requirement-analysis <slug> [--source=…]`
   - `test-case-writing` → `npm run agent:skill -- test-case-writing <slug>`
   - `test-automation-execution` → `npm test`
   - LLM-backed skills (`test-automation-generator`, `test-automation-reviewer`, `test-case-execution`, `bug-reporting`) → "invoke the QA Agent host with SKILL.md loaded."

The CLI is harness-agnostic — it works under `tsx`, `node`, or any host that can spawn a subprocess. The agent contract is the markdown, not this file.

### `run-skill.ts` — single-skill invoker

```bash
tsx scripts/run-skill.ts <skill> <input> [--source=<path>]
```

Validates the skill name, loads the corresponding `SKILL.md` from `.agents/skills/<skill>/`, and either:

- **Materializes a skeleton artifact** (deterministic) — `requirement-analysis` writes a markdown skeleton under `artifacts/requirements/`, `test-case-writing` writes a JSON skeleton under `artifacts/test-cases/`.
- **Prints the next command** (`test-automation-execution` → `npm test`).
- **Loads the SKILL.md and prints a preview** for the LLM-backed skills, which must be run inside the agent host.

`--source=<path>` (requirement-analysis only) validates that the user-authored requirement file exists and adds a `## Source` provenance block to the generated skeleton so the artifact is traceable back to its origin.

### `requirement-resolver.ts` — request → requirement file

Maps a natural-language request to one of:

- `path` — user cited an explicit `.md` path that exists.
- `auto` — exactly one file in `inputs/requirements/` matched the feature candidate.
- `ambiguous` — multiple files tied at the top score; the CLI halts and asks the user to disambiguate.
- `none` — no file matched; the CLI lists what is available and falls back to free-text mode.

Scoring rules (in priority order):

| Match condition | Score |
| --- | --- |
| Slug equals the feature candidate | 100 |
| Slug or candidate contains the other | 80 |
| Candidate appears as a whole word in the H1 | 60 |
| Fuzzy match (Levenshtein ≤ 2, length delta ≤ 2) | 30 |

Stop words (e.g. `analyze`, `the`, `test`, `write`) are filtered before scoring. Two helpers, `requestTriggersRequirementResolution(request)` and `extractExplicitPath(request)`, gate when resolution runs at all.

### `artifact-writers.ts` — typed artifact IO

Pure functions for reading and writing the artifacts produced by the skills:

- `artifactPath(...segments)` → `{ absolute, relative }` under `artifacts/`.
- `writeJsonArtifact` / `readJsonArtifact` — UTF-8 JSON, pretty-printed, trailing newline.
- `writeMarkdownArtifact` / `readMarkdownArtifact` — UTF-8 markdown, trailing newline.
- `readFirstHeading(absPath)` — first H1 or `(no heading)` / `(unreadable)`.
- `sourceProvenance(sourcePath)` — builds the `## Source` block that `requirement-analysis` appends when `--source=…` is passed. Intentionally identical to the shape mandated by the SKILL.md so CLI and LLM agent produce matching artifacts.

These are deterministic helpers, not LLM-bound — the skill's `SKILL.md` describes the *shape*, this file is the *implementation*.

## Call-sequence trace

A typical end-to-end run looks like:

```
user
  └─ tsx scripts/run-agent.ts "Analyze login, write tests, automate, run, report"
        ├─ route(request)                                        [intent-router.ts]
        │    → { workflow: "full-pipeline", skills: [...], rationale: "..." }
        ├─ resolveRequirement(request, REPO_ROOT)                [requirement-resolver.ts]
        │    → { kind: "auto", path: "inputs/requirements/login.md" }
        └─ for each skill:
             ├─ requirement-analysis    → print: npm run agent:skill -- requirement-analysis login --source=…
             │    └─ tsx scripts/run-skill.ts requirement-analysis login --source=…
             │         ├─ readFirstHeading(source)
             │         ├─ sourceProvenance(source)               [artifact-writers.ts]
             │         └─ writeMarkdownArtifact(…)               [artifact-writers.ts]
             ├─ test-case-writing       → print: npm run agent:skill -- test-case-writing login
             │    └─ tsx scripts/run-skill.ts test-case-writing login
             │         └─ writeJsonArtifact(…)                  [artifact-writers.ts]
             ├─ test-automation-generator → LLM-backed; invoke agent host
             ├─ test-automation-reviewer  → LLM-backed; invoke agent host
             ├─ test-automation-execution → print: npm test
             └─ bug-reporting               → LLM-backed; invoke agent host
```

## Why deterministic helpers exist

The agent contract (`.agents/agents/qa-agent/agent.md`) is written for an LLM that can read prose and follow rules. The same rules can be expressed in TypeScript for the bits that don't need a model — file scanning, scoring, JSON marshalling, command printing. Doing it that way gives us:

- **Testable** — pure functions with explicit inputs and outputs.
- **Fast** — no model round-trip for plumbing.
- **Harness-agnostic** — works the same under `tsx`, in CI, or inside any agent host that can spawn a subprocess.
- **Auditable** — the artifact shape and resolution rules are in code, not hidden in a prompt.

The LLM is reserved for the parts that actually need reasoning: interpreting an ambiguous requirement, writing test cases, generating Playwright specs, reviewing them, and composing bug reports.
