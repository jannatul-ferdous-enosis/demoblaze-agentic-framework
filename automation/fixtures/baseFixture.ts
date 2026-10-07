/**
 * Base fixture — extends Playwright's `test` with:
 * - `dialogSink`: a NativeDialogSink. The auto-accept dialog handler is
 *   installed on the actual test page so Demoblaze's `alert()` calls do
 *   not hang tests.
 * - `homePage`: a HomePage instance.
 * - `clearState`: clears cookies and storage.
 */

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import {
  createDialogSink,
  installNativeDialogHandler,
  type NativeDialogSink,
} from '../utils/dialogHandler';
import { clearDemoblazeState } from '../utils/helpers';

export interface BaseFixtures {
  homePage: HomePage;
  dialogSink: NativeDialogSink;
  clearState: () => Promise<void>;
}

export const test = base.extend<BaseFixtures>({
  dialogSink: async ({ page }, use) => {
    const sink = createDialogSink();
    installNativeDialogHandler(page, sink);
    await use(sink);
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  clearState: async ({ page }: { page: Page }, use) => {
    const fn = async () => {
      await clearDemoblazeState(page);
    };
    await use(fn);
  },
});

export { expect };
