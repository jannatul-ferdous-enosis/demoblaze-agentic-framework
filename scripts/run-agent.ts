#!/usr/bin/env tsx
/**
 * CLI: run the QA Agent on a natural-language request.
 *
 * Usage:
 *   tsx scripts/run-agent.ts "Analyze the login requirement"
 *   tsx scripts/run-agent.ts "Run the login smoke tests"
 *   tsx scripts/run-agent.ts "Analyze login, write test cases, automate, run, and report"
 *
 * What this CLI does:
 *  - Loads the intent router
 *  - Classifies the request into a workflow + skill list
 *  - Prints the planned workflow
 *  - For the deterministic part of each skill (artifact skeleton, CLI
 *    commands), executes it. For LLM-backed skills, it prints the
 *    SKILL.md so the human can invoke the agent host.
 *
 * Skills are loaded from `.claude/skills/<skill>/SKILL.md` (Agent Skills
 * convention). The agent contract lives at
 * `.claude/agents/qa-agent/agent.md` and is harness-agnostic — this CLI
 * is just one possible host.
 */

import { route, type RouteDecision } from '../.claude/agents/qa-agent/intent-router';
import * as path from 'node:path';
import * as fs from 'node:fs';

const REPO_ROOT = path.resolve(__dirname, '..');

const request = process.argv.slice(2).join(' ').trim();

if (!request) {
  console.info('Usage: tsx scripts/run-agent.ts "<natural-language request>"');
  process.exit(1);
}

const decision: RouteDecision = route(request);

console.info('=================================================');
console.info('  QA Agent — Demoblaze');
console.info('=================================================');
console.info(`Request:   ${request}`);
console.info(`Workflow:  ${decision.workflow}`);
console.info(`Skills:    ${decision.skills.join(' → ')}`);
console.info(`Rationale: ${decision.rationale}`);
console.info('=================================================');

// Per-skill deterministic actions
for (const skill of decision.skills) {
  const skillMd = path.join(REPO_ROOT, '.claude', 'skills', skill, 'SKILL.md');
  console.info(`\n▶ Skill: ${skill}`);
  try {
    const size = fs.statSync(skillMd).size;
    console.info(`  Loaded SKILL.md (${size} bytes)`);
  } catch {
    console.info(`  No SKILL.md at ${skillMd}`);
  }
  switch (skill) {
    case 'requirement-analysis':
      console.info(`  → Run: npm run agent:skill -- requirement-analysis <feature-slug>`);
      break;
    case 'test-case-writing':
      console.info(`  → Run: npm run agent:skill -- test-case-writing <feature-slug>`);
      break;
    case 'test-automation-execution':
      console.info(`  → Run: npm test`);
      break;
    case 'test-automation-generator':
    case 'test-automation-reviewer':
    case 'test-case-execution':
    case 'bug-reporting':
      console.info(`  → LLM-backed skill; invoke the QA Agent host with SKILL.md loaded.`);
      break;
  }
}
