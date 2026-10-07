/**
 * API client for Demoblaze.
 *
 * Lets tests bypass the UI for setup (e.g., create a user via the
 * `/signup` endpoint so a login test doesn't have to walk the signup
 * modal first). The signup UI itself is tested separately in
 * `automation/tests/signup/`.
 */

import { env } from '../config/environment';
import type { User } from '../types/domain';

interface SignupResponse {
  errorMessage?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(response.status, `POST ${path} → ${response.status}`);
  }
  return (await response.json()) as T;
}

/**
 * Create a user via the signup API. Returns `true` if the user was
 * created, `false` if the user already existed (which is fine for
 * idempotent setup).
 */
export async function signup(user: User): Promise<boolean> {
  // The API expects base64-encoded password (matching the front-end's
  // b64EncodeUnicode). We mirror that behavior here.
  const password = btoa(unescape(encodeURIComponent(user.password)));
  const response = await postJson<SignupResponse>('/signup', {
    username: user.username,
    password,
  });
  if (response.errorMessage === 'This user already exist.') {
    return false;
  }
  return true;
}

/**
 * Generate a unique username suitable for tests that require fresh users.
 * Format: `qa_<base36 timestamp>_<short random>`.
 */
export function generateUsername(prefix = 'qa'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}_${rand}`;
}
