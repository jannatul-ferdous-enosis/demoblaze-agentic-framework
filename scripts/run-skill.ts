#!/usr/bin/env tsx
/**
 * CLI: invoke a single skill.
 *
 * Usage:
 *   tsx scripts/run-skill.ts <skill> <input-file-or-feature> [--source=<path>]
 *
 * Skills available (loaded from .claude/skills/<skill>/SKILL.md):
 *   requirement-analysis, test-case-writing, test-case-execution,
 *   test-automation-generator, test-automation-reviewer,
 *   test-automation-execution, bug-reporting
 *
 * Note: skills that require LLM reasoning (analysis, writing, generation,
 * review, bug reporting) are best executed by the QA Agent host that has
 * access to a model. This CLI provides the deterministic side: validating
 * inputs, loading the SKILL.md, and writing the artifact skeleton.
 *
 * --source=<path>  Optional. Path to a user-authored requirement file
 *                  under inputs/requirements/. When provided to
 *                  requirement-analysis, the skeleton includes a
 *                  `## Source` provenance section.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  artifactPath,
  writeJsonArtifact,
  writeMarkdownArtifact,
  readFirstHeading,
  sourceProvenance,
} from './artifact-writers';

const REPO_ROOT = path.resolve(__dirname, '..');

function printUsage(): void {
  console.info(`run-skill <skill> <input> [--source=<path>]

Skills (loaded from .claude/skills/<skill>/SKILL.md):
  requirement-analysis        <feature-slug>     [--source=inputs/requirements/<slug>.md]
  test-case-writing           <feature-slug>
  test-case-execution         <test-case-id>
  test-automation-generator   <test-case-id>
  test-automation-reviewer    <test-case-id>
  test-automation-execution   <scope>
  bug-reporting               <execution-report-path>

Options:
  --source=<path>   (requirement-analysis only) Path to a user-authored
                    requirement file. Adds a \`## Source\` provenance
                    section to the generated skeleton. Validates the file
                    exists before writing.`);
}

// Parse argv. Positional: <skill> <input>. Optional: --source=<path>.
const argv = process.argv.slice(2);
let skill: string | undefined;
let input: string | undefined;
let sourcePath: string | undefined;

for (const arg of argv) {
  if (arg.startsWith('--source=')) {
    sourcePath = arg.slice('--source='.length);
  } else if (skill === undefined) {
    skill = arg;
  } else if (input === undefined) {
    input = arg;
  } else {
    console.error(`Unexpected argument: ${arg}`);
    printUsage();
    process.exit(1);
  }
}

if (!skill || !input) {
  printUsage();
  process.exit(1);
}

const SKILL_DIR = path.join(REPO_ROOT, '.claude', 'skills', skill, 'SKILL.md');

let skillMd: string;
try {
  skillMd = fs.readFileSync(SKILL_DIR, 'utf8');
} catch {
  console.error(`Unknown skill: ${skill}\nNo SKILL.md at ${SKILL_DIR}`);
  process.exit(2);
}
console.info(`Loaded ${skill} from ${SKILL_DIR}`);

switch (skill) {
  case 'requirement-analysis': {
    // If --source was provided, validate the file exists before
    // delegating the provenance block to the shared helper.
    if (sourcePath) {
      const absSource = path.isAbsolute(sourcePath) ? sourcePath : path.join(REPO_ROOT, sourcePath);
      if (!fs.existsSync(absSource)) {
        console.error(`--source file not found: ${sourcePath}\nResolved to: ${absSource}`);
        process.exit(3);
      }
      const firstHeading = readFirstHeading(absSource);
      console.info(`Source: ${sourcePath} (heading: ${firstHeading})`);
    }

    const parts = artifactPath('requirements', `${input}.md`);
    const skeleton = `# Feature: ${input}

## Requirement Summary
<2-4 sentences>

## Functional Requirements
-

## Business Rules
-

## Preconditions
-

## Positive Scenarios
-

## Negative Scenarios
-

## Boundary Cases
-

## Edge Cases
-

## Testable Acceptance Criteria
-

## Risks
-

## Assumptions
-

## Open Questions
-
${sourceProvenance(sourcePath)}`;
    writeMarkdownArtifact(parts, skeleton);
    console.info(`Wrote ${parts.relative}`);
    break;
  }

  case 'test-case-writing': {
    const parts = artifactPath('test-cases', `${input}.json`);
    const data = {
      feature: input,
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      cases: [],
    };
    writeJsonArtifact(parts, data);
    console.info(`Wrote ${parts.relative}`);
    break;
  }

  case 'test-automation-execution': {
    // Just document the intent — actual Playwright run is via `npm test`.
    console.info(
      `To execute, run: npm test${input ? ` -- --grep "${input}"` : ''}\nResults will be in reports/last-run.json`,
    );
    break;
  }

  case 'test-automation-generator':
  case 'test-automation-reviewer':
  case 'test-case-execution':
  case 'bug-reporting': {
    console.info(
      `Skill ${skill} requires the QA Agent host (LLM-backed). This CLI only loads the SKILL.md. Read the markdown for the workflow:\n\n${skillMd.slice(0, 400)}...`,
    );
    break;
  }

  default:
    printUsage();
    process.exit(2);
}
