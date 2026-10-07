/**
 * Environment configuration for the Demoblaze QA framework.
 *
 * Centralizes runtime URLs and feature flags. Do not hardcode URLs anywhere
 * else in the framework — always read from here.
 */

export interface Environment {
  baseUrl: string;
  apiUrl: string;
  headless: boolean;
  isCI: boolean;
  defaultTimeoutMs: number;
}

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

export function loadEnvironment(): Environment {
  const e: Environment = {
    baseUrl: process.env.DEMOBLAZE_BASE_URL ?? 'https://www.demoblaze.com',
    apiUrl: process.env.DEMOBLAZE_API_URL ?? 'https://api.demoblaze.com',
    headless: readBool(process.env.HEADLESS, true),
    isCI: readBool(process.env.CI, false),
    defaultTimeoutMs: Number(process.env.DEFAULT_TIMEOUT ?? 15000),
  };
  return Object.freeze(e);
}

export const env = loadEnvironment();
