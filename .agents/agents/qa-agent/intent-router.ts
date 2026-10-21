/**
 * Intent router — classifies a natural-language QA request into a workflow.
 *
 * This is a deterministic keyword router, NOT an LLM. The agent's
 * `agent.md` describes the routing rules in human terms; this file
 * implements the same rules so the `scripts/run-skill.ts` and
 * `scripts/run-agent.ts` CLIs can run deterministically.
 *
 * For more nuanced classification, an LLM step can sit in front of this
 * router.
 */

export type SkillName =
  | 'requirement-analysis'
  | 'test-case-writing'
  | 'test-case-reviewer'
  | 'test-case-execution'
  | 'test-automation-generator'
  | 'test-automation-reviewer'
  | 'test-automation-execution'
  | 'bug-reporting';

export type WorkflowName =
  'analyze-only' | 'design-only' | 'automate-and-execute' | 'review-and-report' | 'full-pipeline';

export interface RouteDecision {
  workflow: WorkflowName;
  skills: SkillName[];
  rationale: string;
}

const KEYWORDS: Record<SkillName, RegExp[]> = {
  'requirement-analysis': [/\banalyze\b/i, /\brequirement\b/i, /\bchecklist\b/i, /\bscenarios?\b/i],
  'test-case-writing': [
    /\bwrite tests?\b/i,
    /\bdesign tests?\b/i,
    /\bauthor tests?\b/i,
    /\bcreate tests?\b/i,
    /\bgenerate tests?\b/i,
  ],
  'test-case-reviewer': [
    /\breview.*test cases?\b/i,
    /\bcritique.*test cases?\b/i,
    /\bcheck.*test cases?\b/i,
    /\btest design review\b/i,
    /\bvalidate.*test cases?\b/i,
  ],
  'test-case-execution': [
    /\bexecute\b.*\bTC-[A-Z0-9-]+\b/i,
    /\b(manual|manually)\b/i,
    /\breproduce\b/i,
    /\bexecute test case\b/i,
    /\brun TC-[A-Z0-9-]+\b/i,
  ],
  'test-automation-generator': [
    /\bautomate\b/i,
    /\bplaywright spec\b/i,
    /\bautomation script\b/i,
    /\bautomated test\b/i,
    /\bgenerate.*playwright\b/i,
  ],
  'test-automation-reviewer': [
    /\breview\b.*\b(playwright|automation|spec|script|test automation)\b/i,
    /\b(playwright|automation|spec|script)\b.*\breview\b/i,
    /\bcheck\b.*\b(playwright|automation|spec|script)\b/i,
    /\bcritique\b.*\b(playwright|automation|spec|script)\b/i,
  ],
  'test-automation-execution': [
    /\b(run|execute)\b.*\b(automation|smoke|playwright)\b/i,
    /\b(run|execute)\b.*\btests?\b/i,
    /\brun them\b/i,
    /\bexecute them\b/i,
    /\bplaywright run\b/i,
    /\bsmoke\b/i,
  ],
  'bug-reporting': [
    /\bbugs?\b/i,
    /\bdefects?\b/i,
    /\bfile (a )?bug\b/i,
    /\breport\b.*\b(failures?|defects?|bugs?)\b/i,
  ],
};

/** A cited requirement file path is an unambiguous analysis request. */
const REQUIREMENT_PATH = /inputs\/requirements\/[\w.-]+\.md/i;

/** `<FEATURE>-<NNN>` test case identifiers used by test-case-execution. */
const TEST_CASE_ID = /\b[A-Z][A-Z0-9]*-\d{3}\b/;

function matches(text: string, regexes: RegExp[]): boolean {
  return regexes.some((re) => re.test(text));
}

export function detectSkills(request: string): SkillName[] {
  const found = new Set<SkillName>();
  for (const [skill, regexes] of Object.entries(KEYWORDS) as [SkillName, RegExp[]][]) {
    if (matches(request, regexes)) {
      found.add(skill);
    }
  }

  // Structural signals the keyword table cannot express.
  if (REQUIREMENT_PATH.test(request)) {
    found.add('requirement-analysis');
  }
  if (TEST_CASE_ID.test(request) && !found.has('test-automation-generator')) {
    found.add('test-case-execution');
  }

  return [...found];
}

function chooseWorkflow(skills: SkillName[]): RouteDecision {
  const order: SkillName[] = [
    'requirement-analysis',
    'test-case-writing',
    'test-case-reviewer',
    'test-case-execution',
    'test-automation-generator',
    'test-automation-reviewer',
    'test-automation-execution',
    'bug-reporting',
  ];
  const detected = new Set(skills);
  let present = order.filter((s) => detected.has(s));

  // The reviewer skills are mandatory gates, not optional steps. When a
  // request spans multiple pipeline phases, auto-insert the gates that
  // sit between them so the returned plan is executable without the
  // caller knowing the internal chain. Single-skill requests are left
  // alone — the caller asked for one skill, not a chain.
  if (present.length > 1) {
    if (detected.has('test-automation-generator')) {
      detected.add('test-automation-reviewer');
      detected.add('test-automation-execution');
    }
    if (detected.has('test-case-writing') || detected.has('test-automation-generator')) {
      detected.add('test-case-reviewer');
    }
    if (detected.has('bug-reporting')) {
      detected.add('test-automation-execution');
    }
    present = order.filter((s) => detected.has(s));
  }

  const reason =
    present.length === 0
      ? 'No skill keywords matched; defaulting to requirement-analysis.'
      : `Detected: ${present.join(' → ')}`;

  const SINGLE_SKILL_WORKFLOW: Partial<Record<SkillName, WorkflowName>> = {
    'requirement-analysis': 'analyze-only',
    'test-case-writing': 'design-only',
    'test-case-reviewer': 'review-and-report',
    'test-case-execution': 'review-and-report',
    'test-automation-execution': 'automate-and-execute',
    'test-automation-reviewer': 'review-and-report',
    'bug-reporting': 'review-and-report',
  };
  const workflow: WorkflowName =
    present.length === 1 && SINGLE_SKILL_WORKFLOW[present[0]]
      ? (SINGLE_SKILL_WORKFLOW[present[0]] as WorkflowName)
      : 'full-pipeline';

  return {
    workflow,
    skills: present.length > 0 ? present : ['requirement-analysis'],
    rationale: reason,
  };
}

export function route(request: string): RouteDecision {
  const skills = detectSkills(request);
  return chooseWorkflow(skills);
}
