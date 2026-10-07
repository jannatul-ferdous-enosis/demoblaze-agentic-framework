/**
 * Shared helpers used across page objects and tests.
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Wait for a Bootstrap modal to become visible AND have the `.show` class
 * that Bootstrap applies when a modal is fully open.
 */
export async function waitForBootstrapModal(modalLocator: Locator): Promise<void> {
  await modalLocator.waitFor({ state: 'visible' });
  await expect(modalLocator).toHaveClass(/\bshow\b/);
}

/**
 * Clear cookies that Demoblaze uses for session and cart, so each test
 * starts from a known state. localStorage is best-effort — the page may
 * not be loaded yet.
 */
export async function clearDemoblazeState(page: Page): Promise<void> {
  await page.context().clearCookies();
  try {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  } catch {
    // Page not loaded yet; storage will be empty anyway.
  }
}
