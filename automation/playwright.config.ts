import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

// Load environment variables from repo-root .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const baseURL = process.env.DEMOBLAZE_BASE_URL ?? 'https://www.demoblaze.com';
const headless = (process.env.HEADLESS ?? 'true').toLowerCase() === 'true';
const isCI = (process.env.CI ?? 'false').toLowerCase() === 'true';
const defaultTimeout = Number(process.env.DEFAULT_TIMEOUT ?? 15000);

export default defineConfig({
  testDir: './tests',
  // Skip specs outside the testDir (e.g. fixture / page files)
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Demoblaze is a third-party demo site with informal rate limiting on
  // /login and /signup. Parallel workers overload the API and produce
  // false failures. Always run with one worker.
  workers: 1,
  timeout: defaultTimeout,
  expect: { timeout: defaultTimeout / 2 },
  reporter: [
    ['list'],
    ['json', { outputFile: path.resolve(__dirname, '..', 'reports', 'last-run.json') }],
    [
      'html',
      { outputFolder: path.resolve(__dirname, '..', 'reports', 'html-report'), open: 'never' },
    ],
  ],
  outputDir: path.resolve(__dirname, '..', 'reports', 'test-results'),
  use: {
    baseURL,
    headless,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5000,
    navigationTimeout: defaultTimeout,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
