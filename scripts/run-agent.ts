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
 *  - Runs requirement resolution (auto-discovers requirement files
 *    in `inputs/requirements/` from the user's natural-language request)
 *  - Loads the intent router
 *  - Classifies the request into a workflow + skill list
 *  - Prints the planned workflow
 *  - For the deterministic part of each skill (artifact skeleton, CLI
 *    commands), executes it. For LLM-backed skills, it prints the
 *    SKILL.md so the human can invoke the agent host.
 *
 * Skills are loaded from `.agents/skills/<skill>/SKILL.md` (Agent Skills
 * convention). The agent contract lives at
 * `.agents/agents/qa-agent/agent.md` and is harness-agnostic — this CLI
 * is just one possible host.
 */

import { route, type RouteDecision } from '../.agents/agents/qa-agent/intent-router';
import {
  resolveRequirement,
  requestTriggersRequirementResolution,
  extractExplicitPath,
  type ResolvedRequirement,
} from './requirement-resolver';
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

// Pre-step: requirement resolution. Runs when the request targets the
// requirement pipeline OR when the user explicitly cited a .md path.
let resolution: ResolvedRequirement | null = null;
if (requestTriggersRequirementResolution(request) || extractExplicitPath(request) !== null) {
  resolution = resolveRequirement(request, REPO_ROOT);
  console.info('');
  console.info('▶ Requirement resolution');
  switch (resolution.kind) {
    case 'path':
      console.info(`  Using explicit path: ${resolution.path}`);
      break;
    case 'auto':
      console.info(`  Auto-discovered: ${resolution.path}`);
      console.info(
        `  → Pass via: npm run agent:skill -- requirement-analysis <feature> --source=${resolution.path}`,
      );
      break;
    case 'ambiguous':
      console.info(`  Multiple files match. Please pick one:`);
      for (const c of resolution.candidates) {
        console.info(`    - ${c.path}  (score ${c.score})`);
        if (c.heading) console.info(`        H1: ${c.heading}`);
        if (c.excerpt) console.info(`        "${c.excerpt}"`);
      }
      console.info('  Re-run with an explicit path, e.g.:');
      console.info(
        '    npm run agent:pipeline -- "analyze login from inputs/requirements/login.md"',
      );
      // Halt before skill execution to force the user to disambiguate.
      console.info('=================================================');
      process.exit(4);
      break; // unreachable; satisfies no-fallthrough
    case 'none':
      console.info(`  No matching requirement file.`);
      if (resolution.available.length > 0) {
        console.info(`  Available files: ${resolution.available.join(', ')}`);
        console.info(`  Falling back to free-text mode.`);
      } else {
        console.info(
          `  inputs/requirements/ is empty. Author a requirement file or paste a description.`,
        );
        console.info(`  Falling back to free-text mode.`);
      }
      break;
  }
}

// Per-skill deterministic actions
for (const skill of decision.skills) {
  const skillMd = path.join(REPO_ROOT, '.agents', 'skills', skill, 'SKILL.md');
  console.info(`\n▶ Skill: ${skill}`);
  try {
    const size = fs.statSync(skillMd).size;
    console.info(`  Loaded SKILL.md (${size} bytes)`);
  } catch {
    console.info(`  No SKILL.md at ${skillMd}`);
  }
  switch (skill) {
    case 'requirement-analysis': {
      // If a file was resolved, suggest the --source invocation. The
      // bare `<feature-slug>` invocation is still printed for fallback.
      if (resolution && (resolution.kind === 'auto' || resolution.kind === 'path')) {
        const slug = path.basename(resolution.path, '.md');
        console.info(
          `  → Run: npm run agent:skill -- requirement-analysis ${slug} --source=${resolution.path}`,
        );
      } else {
        console.info(`  → Run: npm run agent:skill -- requirement-analysis <feature-slug>`);
      }
      break;
    }
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
