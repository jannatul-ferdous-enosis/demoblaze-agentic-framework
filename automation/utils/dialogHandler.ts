/**
 * Dialog handler for Demoblaze.
 *
 * Demoblaze uses BOTH native `window.alert()` (for most actions) AND
 * SweetAlert (for the purchase confirmation). Playwright's
 * `page.on('dialog', ...)` only catches native dialogs.
 *
 * This module provides:
 * - `installNativeDialogHandler(page, sink)` — auto-accepts native alerts
 *   and forwards the message to a sink for later assertion.
 * - `waitForSweetAlertAndAccept(page, expectedTitle?)` — handles the
 *   SweetAlert success modal after a purchase.
 */

import type { Page, Dialog } from '@playwright/test';

export interface NativeDialogSink {
  messages: string[];
  last(): string | undefined;
  clear(): void;
}

export function createDialogSink(): NativeDialogSink {
  const messages: string[] = [];
  return {
    messages,
    last: () => messages[messages.length - 1],
    clear: () => {
      messages.length = 0;
    },
  };
}

/**
 * Installs a one-time native dialog handler. Auto-accepts alerts and
 * forwards the message into the sink.
 */
export function installNativeDialogHandler(page: Page, sink: NativeDialogSink): void {
  page.on('dialog', async (dialog: Dialog) => {
    if (dialog.type() === 'alert' || dialog.type() === 'confirm' || dialog.type() === 'prompt') {
      sink.messages.push(dialog.message());
    }
    await dialog.accept();
  });
}

/**
 * Wait for a SweetAlert modal (`.swal-modal`) and accept it by clicking
 * the OK button. If `expectedTitle` is provided, asserts the title contains
 * the substring.
 *
 * Returns the title text.
 */
export async function waitForSweetAlertAndAccept(
  page: Page,
  expectedTitle?: string | RegExp,
): Promise<string> {
  const modal = page.locator('.swal-modal').first();
  await modal.waitFor({ state: 'visible' });
  const title = (await page.locator('.swal-title').first().textContent()) ?? '';
  if (expectedTitle !== undefined) {
    const matches =
      typeof expectedTitle === 'string' ? title.includes(expectedTitle) : expectedTitle.test(title);
    if (!matches) {
      throw new Error(`SweetAlert title "${title}" did not match ${String(expectedTitle)}`);
    }
  }
  await page.getByRole('button', { name: 'OK' }).click();
  return title.trim();
}
