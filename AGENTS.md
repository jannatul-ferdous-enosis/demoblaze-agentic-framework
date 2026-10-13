# AGENTS.md

This project uses a **skills-based QA agent** framework. The agent contract
lives at **`.agents/agents/qa-agent/agent.md`** — load it as the
system-level instruction for any host that supports Agent Skills (Claude
Code, puku-cli, Cursor, Aider, or the bundled `scripts/run-agent.ts`).

The seven QA skills are pure-markdown contracts under **`.agents/skills/`**,
loaded on demand by the agent based on the user request.

## Folder layout

```
.agents/
├── agents/qa-agent/
│   ├── agent.md                 # ← entry point: load this
│   ├── intent-router.ts         # deterministic keyword router
│   ├── selector-cheatsheet.md   # verified Demoblaze selectors
│   └── workflows/               # skill chain specs
└── skills/                      # 7 skill folders, one SKILL.md each
```

## For new hosts

1. Load `.agents/agents/qa-agent/agent.md` as the system prompt.
2. Read each `.agents/skills/<skill>/SKILL.md` on demand.
3. Read & write artifacts in `artifacts/`.
4. Invoke Playwright via the `automation/` layer.
5. Enforce the hard rules listed in the agent contract.

For architecture, conventions, and how to add a new skill or agent, see
`.agents/agents/qa-agent/agent.md` and the project `README.md`.
