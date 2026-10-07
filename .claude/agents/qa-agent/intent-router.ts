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
    /\btest cases?\b/i,
    /\bwrite tests?\b/i,
    /\bdesign tests?\b/i,
    /\btest design\b/i,
  ],
  'test-case-execution': [
    /\bexecute test case\b/i,
    /\breproduce\b/i,
    /\bmanually test\b/i,
    /\brun\b.*TC-/i,
  ],
  'test-automation-generator': [
    /\bautomate\b/i,
    /\bscript\b/i,
    /\bgenerate.*playwright\b/i,
    /\bautomation script\b/i,
  ],
  'test-automation-reviewer': [/\breview\b/i, /\bcritique\b/i, /\bcheck.*automation\b/i],
  'test-automation-execution': [
    /\brun tests?\b/i,
    /\brun the\b.*\bautomation\b/i,
    /\brun them\b/i,
    /\bexecute tests?\b/i,
    /\bexecute the\b.*\bautomation\b/i,
    /\bexecute them\b/i,
    /\bplaywright run\b/i,
    /\bsmoke\b/i,
  ],
  'bug-reporting': [/\bbug\b/i, /\bdefect\b/i, /\bfile a bug\b/i, /\bcreate.*report\b/i],
};

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
  return [...found];
}

function chooseWorkflow(skills: SkillName[]): RouteDecision {
  const order: SkillName[] = [
    'requirement-analysis',
    'test-case-writing',
    'test-automation-generator',
    'test-automation-reviewer',
    'test-automation-execution',
    'bug-reporting',
  ];
  const present = order.filter((s) => skills.includes(s));
  const reason =
    present.length === 0
      ? 'No skill keywords matched; defaulting to requirement-analysis.'
      : `Detected: ${present.join(' → ')}`;

  const SINGLE_SKILL_WORKFLOW: Partial<Record<SkillName, WorkflowName>> = {
    'requirement-analysis': 'analyze-only',
    'test-case-writing': 'design-only',
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
