/**
 * Pure functions that write artifacts produced by skills.
 *
 * These are deterministic helpers used by the `run-skill.ts` CLI when a
 * skill needs to materialize a file from structured input. The skill's
 * SKILL.md describes the artifact shape; this module is the typed
 * implementation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');

export interface ArtifactPath {
  absolute: string;
  relative: string;
}

export function artifactPath(...segments: string[]): ArtifactPath {
  const relative = path.join('artifacts', ...segments);
  const absolute = path.join(REPO_ROOT, relative);
  return { absolute, relative };
}

export function writeJsonArtifact(parts: ArtifactPath, data: unknown): void {
  fs.mkdirSync(path.dirname(parts.absolute), { recursive: true });
  fs.writeFileSync(parts.absolute, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function writeMarkdownArtifact(parts: ArtifactPath, content: string): void {
  fs.mkdirSync(path.dirname(parts.absolute), { recursive: true });
  fs.writeFileSync(parts.absolute, content.trimEnd() + '\n', 'utf8');
}

export function readJsonArtifact<T>(parts: ArtifactPath): T {
  const raw = fs.readFileSync(parts.absolute, 'utf8');
  return JSON.parse(raw) as T;
}

export function readMarkdownArtifact(parts: ArtifactPath): string {
  return fs.readFileSync(parts.absolute, 'utf8');
}

/**
 * Extract the first H1 heading from a markdown file. Returns
 * "(no heading)" if none is found.
 */
export function readFirstHeading(absPath: string): string {
  try {
    const content = fs.readFileSync(absPath, 'utf8');
    const m = content.match(/^#\s+(.+?)\s*$/m);
    return m ? m[1].trim() : '(no heading)';
  } catch {
    return '(unreadable)';
  }
}

/**
 * Build a `## Source` provenance block for an artifact that was
 * generated from a user-authored requirement file. The block is
 * intentionally identical to what the requirement-analysis SKILL.md
 * mandates so the LLM agent and the host CLI produce the same shape.
 *
 * Returns an empty string when no source path is provided.
 */
export function sourceProvenance(sourcePath: string | undefined): string {
  if (!sourcePath) return '';
  const abs = path.isAbsolute(sourcePath) ? sourcePath : path.join(REPO_ROOT, sourcePath);
  const firstHeading = readFirstHeading(abs);
  return `\n## Source\n\n- Path: ${sourcePath}\n- First heading: ${firstHeading}\n`;
}
