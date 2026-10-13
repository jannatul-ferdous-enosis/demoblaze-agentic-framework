/**
 * Requirement resolver — resolves a natural-language user request to a
 * requirement file under `inputs/requirements/`.
 *
 * This is a deterministic helper, NOT an LLM. The agent's `agent.md`
 * describes the same resolution rules in human terms; this file is the
 * typed implementation that host CLIs (run-agent.ts) and tests can call.
 *
 * Mirrors `intent-router.ts`: it is host-side infrastructure. The LLM-
 * backed agent can also do the resolution conversationally following
 * the same rules.
 *
 * Resolution outcomes (union type, exhaustive):
 *   - 'path'      — user cited an explicit .md path; use it
 *   - 'auto'      — exactly one file matched the feature candidate
 *   - 'ambiguous' — multiple files matched; caller must ask the user
 *   - 'none'      — no file matched; caller lists available files
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const REQUIREMENTS_DIR = 'inputs/requirements';

// Stop words that do not contribute to the feature candidate.
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'analyze',
  'automate',
  'be',
  'can',
  'cases',
  'checklist',
  'cover',
  'create',
  'design',
  'do',
  'for',
  'generate',
  'give',
  'i',
  'in',
  'me',
  'on',
  'or',
  'please',
  'run',
  'scenarios',
  'should',
  'test',
  'tests',
  'the',
  'to',
  'we',
  'what',
  'with',
  'write',
  'you',
  'your',
]);

// Explicit-path regex: matches `path/to/file.md` or "path/to/file.md".
// Looks for a .md token possibly surrounded by quotes or backticks.
const EXPLICIT_PATH_RE = /[`"']?([\w/.-]+\.md)[`"']?/i;

export interface Candidate {
  /** Path relative to repo root, e.g. "inputs/requirements/login.md". */
  path: string;
  /** Slug derived from filename (without .md). */
  slug: string;
  /** First H1 heading of the file, or empty if none. */
  heading: string;
  /** First 80 chars of the file (truncated on a word boundary). */
  excerpt: string;
  /** Match score (higher = better). */
  score: number;
}

export type ResolvedRequirement =
  | { kind: 'path'; path: string }
  | { kind: 'auto'; path: string }
  | { kind: 'ambiguous'; candidates: Candidate[] }
  | { kind: 'none'; available: string[] };

/** Compute Levenshtein distance between two strings. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Extract a feature candidate (slug-like noun) from a natural-language request. */
export function extractFeatureCandidate(request: string): string {
  const tokens = request
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
  return tokens.join('-');
}

/** Parse the first H1 heading out of a markdown string. */
function firstH1(content: string): string {
  const m = content.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : '';
}

/** Build an excerpt from the first non-empty line(s) of a markdown file. */
function makeExcerpt(content: string, max = 80): string {
  const text = content
    .replace(/^#.*$/gm, '') // strip headings
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  // Truncate on a word boundary.
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '…';
}

function listRequirementFiles(
  repoRoot: string,
): { absPath: string; relPath: string; slug: string }[] {
  const dir = path.join(repoRoot, REQUIREMENTS_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => ({
      absPath: path.join(dir, f),
      relPath: path.join(REQUIREMENTS_DIR, f),
      slug: f.replace(/\.md$/, ''),
    }));
}

/** Score a single requirement file against a feature candidate. */
function scoreFile(candidate: string, slug: string, heading: string): number {
  if (!candidate) return 0;
  const c = candidate.toLowerCase();
  const s = slug.toLowerCase();
  const h = heading.toLowerCase();

  if (s === c) return 100;
  if (s.includes(c) || c.includes(s)) return 80;

  // Heading match: the candidate appears as a whole word in the H1.
  const headingWords = new Set(h.split(/\W+/).filter(Boolean));
  if (headingWords.has(c)) return 60;

  // Body-heading match: candidate appears as a whole word in any heading.
  // (Caller pre-computes a bodyHeadingMatch flag via scanFile; for the
  // simple in-memory scoring we approximate by checking heading words.)
  if ([...headingWords].some((w) => w === c)) return 40;

  // Fuzzy: Levenshtein ≤ 2 between candidate and slug.
  if (Math.abs(s.length - c.length) <= 2 && levenshtein(s, c) <= 2) return 30;

  return 0;
}

/** Scan a single file and return its candidate record (no score). */
function scanFile(absPath: string, _relPath: string): { heading: string; excerpt: string } {
  let content = '';
  try {
    content = fs.readFileSync(absPath, 'utf8');
  } catch {
    return { heading: '', excerpt: '' };
  }
  return { heading: firstH1(content), excerpt: makeExcerpt(content) };
}

/**
 * Detect whether a request targets the requirement pipeline. Used to
 * skip resolution for execution-only requests (e.g. "run the smoke
 * tests").
 */
export function requestTriggersRequirementResolution(request: string): boolean {
  const r = request.toLowerCase();
  return (
    /\banalyze\b/.test(r) ||
    /\brequirement\b/.test(r) ||
    /\bchecklist\b/.test(r) ||
    /\bscenarios?\b/.test(r) ||
    /\btest cases?\b/.test(r) ||
    /\bwrite tests?\b/.test(r) ||
    /\bdesign tests?\b/.test(r) ||
    /\btest design\b/.test(r) ||
    /\bautomate\b/.test(r) ||
    /\bscript\b/.test(r) ||
    /\bautomation script\b/.test(r) ||
    /\bgenerate.*playwright\b/.test(r)
  );
}

/**
 * Detect whether a request cites an explicit .md path (the advanced
 * override). Returns the first match (without quotes/backticks), or
 * null if none. This is independent of the request's keywords — even
 * "process inputs/requirements/login.md" without any analyze/automate
 * keyword should still trigger resolution.
 */
export function extractExplicitPath(request: string): string | null {
  const m = request.match(EXPLICIT_PATH_RE);
  return m ? m[1] : null;
}

/**
 * Resolve a request to a requirement file. Pure function.
 *
 * @param request  The user's natural-language request.
 * @param repoRoot Absolute path to the repo root.
 */
export function resolveRequirement(request: string, repoRoot: string): ResolvedRequirement {
  // 1. Explicit path override.
  const pathMatch = request.match(EXPLICIT_PATH_RE);
  if (pathMatch) {
    const cited = pathMatch[1];
    const abs = path.isAbsolute(cited) ? cited : path.join(repoRoot, cited);
    if (fs.existsSync(abs)) {
      const rel = path.isAbsolute(cited) ? cited : cited;
      return { kind: 'path', path: rel };
    }
    // Path cited but doesn't exist; surface as 'none' with the cited
    // path echoed so the caller can show a clear error.
    return { kind: 'none', available: [`(cited but not found: ${cited})`] };
  }

  // 2. Extract feature candidate.
  const candidate = extractFeatureCandidate(request);
  if (!candidate) {
    return { kind: 'none', available: listAvailable(repoRoot) };
  }

  // 3. Score every requirement file.
  const files = listRequirementFiles(repoRoot);
  const scored: Candidate[] = [];
  for (const f of files) {
    const { heading, excerpt } = scanFile(f.absPath, f.relPath);
    const score = scoreFile(candidate, f.slug, heading);
    if (score > 0) {
      scored.push({ path: f.relPath, slug: f.slug, heading, excerpt, score });
    }
  }

  // 4. Sort descending by score.
  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { kind: 'none', available: listAvailable(repoRoot) };
  }

  // 5. Top score unique → auto.
  if (scored.length === 1 || scored[0].score > scored[1].score) {
    return { kind: 'auto', path: scored[0].path };
  }

  // 6. Tie at top → ambiguous.
  const top = scored[0].score;
  return {
    kind: 'ambiguous',
    candidates: scored.filter((c) => c.score === top),
  };
}

/** List all available requirement files (slugs only, for "no match" UX). */
export function listAvailable(repoRoot: string): string[] {
  return listRequirementFiles(repoRoot)
    .map((f) => f.slug)
    .sort();
}
