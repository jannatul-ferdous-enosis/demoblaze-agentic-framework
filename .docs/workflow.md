# QA Agent — System Workflow

This document visualizes how the **single QA Agent** routes a natural-language
user request into one or more skills, and how skills exchange artifacts.

The architecture is **token-saving by design**: the agent is a thin
decision-maker, each skill is a small markdown contract loaded only when
needed, and tools (Playwright, file I/O) are never embedded in skills.

---

## 1. High-level architecture

```mermaid
flowchart TB
    User([User request<br/>natural language])

    subgraph Host["Host harness (Claude Code, puku-cli, or scripts/run-agent.ts)"]
        Agent["QA Agent<br/>(.agents/agents/qa-agent/agent.md)"]
        Router["Intent router<br/>(intent-router.ts)"]
        Resolver["Requirement resolver<br/>(requirement-resolver.ts)"]
    end

    subgraph Skills["Skills (.agents/skills/&lt;name&gt;/SKILL.md) — loaded on demand"]
        S1["requirement-analysis"]
        S2["test-case-writing"]
        S3["test-case-execution"]
        S4["test-automation-generator"]
        S5["test-automation-reviewer"]
        S6["test-automation-execution"]
        S7["bug-reporting"]
    end

    subgraph Artifacts["Artifacts (artifacts/**) — contract between skills"]
        A1["requirements/&lt;feature&gt;.md"]
        A2["test-cases/&lt;feature&gt;.json"]
        A3["automation/tests/&lt;feature&gt;/&lt;test-id&gt;.spec.ts"]
        A4["automation-reviews/&lt;feature&gt;-review.md"]
        A5["reports/last-run.json"]
        A6["bug-reports/BUG-&lt;NNN&gt;-&lt;slug&gt;.md"]
    end

    subgraph Tools["Tools (automation/**) — side-effecting code"]
        T1["page objects<br/>fixtures, factories"]
        T2["Playwright runner"]
    end

    Browser[(Demoblaze<br/>www.demoblaze.com)]

    User --> Agent
    Agent --> Router
    Agent --> Resolver
    Resolver -.auto-discover.-> User

    Agent -->|"loads on demand"| Skills
    Skills <-->|"read / write"| Artifacts
    S4 & S6 -->|"uses"| T1
    T1 -->|"drives"| T2
    T2 --> Browser
    S7 -->|"emits"| A6
```

---

## 2. End-to-end request lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Host as Host harness
    participant Agent as QA Agent
    participant Router as Intent router
    participant Resolver as Requirement resolver
    participant Skill as Skill (SKILL.md)
    participant FS as artifacts/ filesystem
    participant PW as Playwright
    participant App as Demoblaze

    User->>Host: "Analyze login, write tests, automate, run, report"
    Host->>Agent: load agent.md as system contract
    Agent->>Router: classify request → workflow + skills[]
    Router-->>Agent: { workflow: full-pipeline, skills: [...] }

    alt request targets requirement pipeline
        Agent->>Resolver: resolve feature → requirement file
        Resolver->>FS: scan inputs/requirements/*.md
        Resolver-->>Agent: { kind: 'auto' | 'path' | 'ambiguous' | 'none' }
    end

    loop for each skill in order
        Agent->>Skill: load .agents/skills/<skill>/SKILL.md
        Skill->>FS: read upstream artifact
        Skill->>FS: write new artifact
        Agent->>FS: validate artifact (path + shape)
        alt validation fails
            Agent-->>User: HALT — report clear error
        end
    end

    opt automation phase
        Skill->>PW: invoke Playwright
        PW->>App: drive browser
        App-->>PW: results
        PW-->>Skill: pass/fail + evidence
    end

    Agent-->>User: concise summary
```

---

## 3. Decision tree: user prompt → workflow

```mermaid
flowchart TD
    P([User prompt]) --> Q1{Contains analyze / requirement /<br/>test cases / automate / script?}
    Q1 -->|No| Q2{Contains review / bug / defect?}
    Q1 -->|Yes| Q3{Multiple skills matched?}

    Q2 -->|Yes| W1[Workflow: review-and-report]
    Q2 -->|No| Q4{Contains run / execute /<br/>smoke / playwright run?}
    Q4 -->|Yes| W2[Workflow: automate-and-execute]
    Q4 -->|No| W3[Workflow: analyze-only<br/>default fallback]

    Q3 -->|No, single match| W4a[analyze-only]
    Q3 -->|Yes, multi-skill| W4[Workflow: full-pipeline]

    W4a -.->|e.g. "Analyze login"| S1
    W1 -.->|e.g. "review this test"| S5
    W1 -.->|e.g. "log a bug"| S7
    W2 -.->|e.g. "run smoke tests"| S6
    W3 -.->|e.g. "design tests for X"| S2
    W4 -.->|e.g. "analyze, write,<br/>automate, run, report"| S1 & S2 & S4 & S5 & S6 & S7
```

---

## 4. The five workflows (skill chains)

```mermaid
flowchart LR
    subgraph analyze-only
        A0[requirement-analysis]
    end

    subgraph design-only
        B0[test-case-writing]
    end

    subgraph automate-and-execute
        C1[test-automation-generator] --> C2[test-automation-reviewer] --> C3[test-automation-execution] --> C4{any failures?}
        C4 -->|yes| C5[bug-reporting]
        C4 -->|no| C6([done])
    end

    subgraph review-and-report
        D1[test-automation-reviewer]
        D2[bug-reporting]
    end

    subgraph full-pipeline
        E1[requirement-analysis] --> E2[test-case-writing] --> E3[test-automation-generator] --> E4[test-automation-reviewer] --> E5[test-automation-execution] --> E6{any failures?}
        E6 -->|yes| E7[bug-reporting]
        E6 -->|no| E8([done])
    end
```

---

## 5. Full pipeline — the canonical sequence

```mermaid
flowchart TB
    Start([User: "Analyze login, write tests,<br/>automate, run, report failures"]) --> Pre[Pre-phase:<br/>requirement resolution]

    Pre -->|"auto-discover<br/>or explicit path"| Req[requirement-analysis]
    Req -->|"writes"| A1[("artifacts/requirements/<br/>login.md")]
    A1 -->|validates| V1{file exists +<br/>13 sections +<br/>provenance?}
    V1 -->|no| H1([HALT — clear error])
    V1 -->|yes| TCW[test-case-writing]
    TCW -->|"writes"| A2[("artifacts/test-cases/<br/>login.json")]
    A2 -->|validates| V2{cases[] valid?}
    V2 -->|no| H1
    V2 -->|yes| TAG[test-automation-generator]
    TAG -->|"writes"| A3[("automation/tests/auth/<br/>login.spec.ts")]
    A3 -->|validates| V3{imports baseFixture +<br/>no waitForTimeout?}
    V3 -->|no| H1
    V3 -->|yes| TAR[test-automation-reviewer]
    TAR -->|"writes"| A4[("artifacts/automation-reviews/<br/>login-review.md")]
    A4 -->|validates| V4{verdict?}
    V4 -->|FAIL| H2([HALT — do not run])
    V4 -->|PASS / PASS WITH WARNINGS| TAE[test-automation-execution]
    TAE -->|"runs Playwright"| A5[("reports/last-run.json")]
    A5 -->|any failures?| V5
    V5 -->|no| Done([Done — all passing])
    V5 -->|yes| BR[bug-reporting]
    BR -->|"writes"| A6[("artifacts/bug-reports/<br/>BUG-001-*.md")]
    A6 --> Done
```

---

## 6. Requirement resolution algorithm

This is the pre-step that runs before `requirement-analysis` or
`test-case-writing` to avoid pasting requirement text into chat.

```mermaid
flowchart TD
    R([User prompt]) --> R1[Lowercase + strip stop words]
    R1 --> R2{Contains explicit .md path<br/>(quoted or backticked)?}
    R2 -->|yes| P1[Use cited path verbatim]
    R2 -->|no| R3[Extract feature candidate]
    R3 --> R4[Scan inputs/requirements/*.md]
    R4 --> R5[Score each file:<br/>100 exact slug<br/>80 substring match<br/>60 H1 word match<br/>40 body heading<br/>30 Levenshtein ≤ 2]
    R5 --> R6{Top score unique?}
    R6 -->|yes, score ≥ 30| Auto[Auto-resolve → use file]
    R6 -->|no, all < 30| None[No match — list available,<br/>fall back to free text]
    R6 -->|tie at top| Amb[Ambiguous — ASK user to pick]
    P1 --> Out[Pass to skill as requirementSourcePath]
    Auto --> Out
    None --> Out
    Amb --> Out
```

---

## 7. Skill → artifact → next-skill map

```mermaid
graph LR
    subgraph Inputs["inputs/ (user-authored)"]
        I1[inputs/requirements/login.md]
    end

    subgraph Artifacts["artifacts/ (skill-produced)"]
        O1[requirements/login.md]
        O2[test-cases/login.json]
        O3[automation/tests/auth/login.spec.ts]
        O4[automation-reviews/login-review.md]
        O5[reports/last-run.json]
        O6[bug-reports/BUG-001-*.md]
    end

    I1 -->|requirement-analysis| O1
    O1 -->|test-case-writing| O2
    O2 -->|test-automation-generator| O3
    O3 -->|test-automation-reviewer| O4
    O4 -->|test-automation-execution| O5
    O5 -->|if failures: bug-reporting| O6

    classDef input fill:#fef3c7,stroke:#b45309
    classDef artifact fill:#dbeafe,stroke:#1d4ed8
    class I1 input
    class O1,O2,O3,O4,O5,O6 artifact
```

---

## 8. State machine — review verdict gates execution

```mermaid
stateDiagram-v2
    [*] --> SpecGenerated
    SpecGenerated --> Reviewing: test-automation-reviewer
    Reviewing --> PASS: no findings / INFO only
    Reviewing --> PASSwithWARN: only MINOR findings
    Reviewing --> FAIL: ≥1 BLOCKER or ≥2 MAJOR

    PASS --> Executing
    PASSwithWARN --> Executing
    FAIL --> Halted: do not execute

    Executing --> AllPassed: reports/last-run.json<br/>failed == 0
    Executing --> SomeFailed: failed > 0

    AllPassed --> [*]
    SomeFailed --> FilingBug: bug-reporting
    FilingBug --> [*]
    Halted --> [*]
```

---

## 9. Layer responsibilities (what lives where)

```mermaid
flowchart TB
    subgraph L1["Layer 1 — Reasoning<br/>.agents/agents/qa-agent/"]
        L1a[agent.md<br/>identity + routing + hard rules]
        L1b[workflows/*.md<br/>skill chains]
        L1c[intent-router.ts<br/>deterministic classifier]
        L1d[selector-cheatsheet.md<br/>verified Demoblaze selectors]
    end

    subgraph L2["Layer 2 — Domain knowledge<br/>.agents/skills/"]
        L2a[requirement-analysis]
        L2b[test-case-writing]
        L2c[test-case-execution]
        L2d[test-automation-generator]
        L2e[test-automation-reviewer]
        L2f[test-automation-execution]
        L2g[bug-reporting]
    end

    subgraph L3["Layer 3 — Artifacts<br/>artifacts/"]
        L3a[requirements/*.md]
        L3b[test-cases/*.json]
        L3c[automation/*.spec.ts]
        L3d[automation-reviews/*.md]
        L3e[bug-reports/*.md]
    end

    subgraph L4["Layer 4 — Side effects<br/>automation/ + scripts/"]
        L4a[page objects]
        L4b[fixtures + factories]
        L4c[Playwright runner]
        L4d[scripts/run-agent.ts]
        L4e[scripts/run-skill.ts]
    end

    L1 -->|"loads on demand"| L2
    L2 -->|"read / write"| L3
    L2 -. "uses selectors from" .-> L1d
    L2 -. "may invoke" .-> L4
    L3 -->|"consumed by"| L4
    L4d -->|"calls"| L1c
    L4d -->|"calls"| L4e
```

**Boundary rule (the token-saving invariant):**
- L2 (skills) does **not** contain selectors, page objects, or fixtures — it speaks in artifact terms.
- L4 (tools) does **not** contain QA policy — it is pure Playwright + file I/O.
- L1 (agent) does **not** bypass L2 contracts — it routes only.

---

## 10. Token-saving properties (why this design scales)

```mermaid
mindmap
  root((Token saving))
    On-demand loading
      Agent loads only the skills the request needs
      SKILL.md files are small markdown
    No re-pasting
      Requirement files auto-discovered from inputs/requirements/
      Artifacts passed by path, not inlined in chat
    Deterministic first
      Intent router is regex-based, not LLM
      Requirement resolver is scored, not LLM
    Single source of truth
      Selectors in one cheatsheet
      One writer per artifact type in scripts/artifact-writers.ts
    Hard boundary
      Skills do not embed page objects
      Tools do not embed QA policy
    Parallel-safe routing
      No skill runs before its upstream artifact exists
      Halt on any validation failure
```

---

## 11. Adding a new skill (migration path)

```mermaid
flowchart TD
    Start([Need new QA activity X]) --> S1[1. Author .agents/skills/&lt;X&gt;/SKILL.md<br/>with standard template]
    S1 --> S2[2. Define new artifact shape if needed<br/>+ add writer in scripts/artifact-writers.ts<br/>+ type in automation/types/domain.ts]
    S2 --> S3[3. Register in agent.md routing table]
    S3 --> S4[4. Add keywords to intent-router.ts]
    S4 --> S5[5. If multi-step, add workflow spec<br/>under .agents/agents/qa-agent/workflows/]
    S5 --> Done([Skill is live — any host<br/>Claude Code / puku-cli /<br/>scripts/run-agent.ts can use it])
```

---

**See also:**

- `.agents/agents/qa-agent/agent.md` — agent contract
- `.agents/skills/<name>/SKILL.md` — per-skill markdown contracts
- `.agents/agents/qa-agent/workflows/*.md` — workflow specs
- `scripts/run-agent.ts` — reference Node host
- `README.md` — full architecture overview
