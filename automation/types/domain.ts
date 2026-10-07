/**
 * Domain types shared by page objects, fixtures, tests, and skill artifacts.
 */

export interface User {
  username: string;
  password: string;
}

export interface OrderData {
  name: string;
  country: string;
  city: string;
  creditCard: string;
  month: string;
  year: string;
}

export type Priority = 'P0' | 'P1' | 'P2';

export type TestCaseType =
  'functional' | 'negative' | 'boundary' | 'validation' | 'state' | 'regression';

export interface TestCase {
  id: string;
  feature: string;
  scenario: string;
  type: TestCaseType;
  priority: Priority;
  preconditions: string[];
  testData: Record<string, string>;
  steps: string[];
  expectedResult: string;
  automationCandidate: boolean;
  notes?: string;
}

export interface TestCaseFile {
  feature: string;
  version: string;
  generatedAt: string;
  sourceArtifact?: string;
  cases: TestCase[];
}

export type ExecutionStatus = 'PASS' | 'FAIL' | 'BLOCKED';

export interface ExecutionStep {
  index: number;
  action: string;
  actual: string;
  ok: boolean;
}

export interface ExecutionResult {
  executionId: string;
  testCaseId: string;
  feature: string;
  executedAt: string;
  executor: string;
  environment: {
    baseUrl: string;
    browser: string;
    headless: boolean;
  };
  status: ExecutionStatus;
  steps: ExecutionStep[];
  expectedResult: string;
  actualResult: string;
  evidence: {
    screenshotPath?: string;
    pageUrl?: string;
    alertMessage?: string | null;
    consoleErrors?: string[];
  };
  notes?: string;
}

export type ReviewVerdict = 'PASS' | 'PASS WITH WARNINGS' | 'FAIL';
export type ReviewSeverity = 'BLOCKER' | 'MAJOR' | 'MINOR' | 'INFO';

export interface ReviewFinding {
  severity: ReviewSeverity;
  area: string;
  problem: string;
  recommendation: string;
}
