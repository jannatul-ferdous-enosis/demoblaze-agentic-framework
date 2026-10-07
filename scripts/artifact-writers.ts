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
