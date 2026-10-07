/**
 * Login — automated test suite for the Demoblaze Log in modal.
 *
 * Source artifacts:
 *   - artifacts/requirements/login.md
 *   - artifacts/test-cases/login.json
 *
 * Cases covered:
 *   LOGIN-001 (P0)  — Valid credentials succeed
 *   LOGIN-002 (P0)  — Logout returns to logged-out state
 *   LOGIN-003 (P1)  — Wrong password shows alert
 *   LOGIN-004 (P1)  — Unknown user shows alert
 *   LOGIN-005 (P1)  — Empty form shows alert
 *
 * Selector source of truth: agent/qa-agent/selector-cheatsheet.md
 *
 * The dialog handler is installed by `baseFixture.ts` on the test's
 * actual page, so Demoblaze's `alert()` calls are auto-accepted and
 * captured into `dialogSink.messages`.
 */

import { test, expect } from '../../fixtures/baseFixture';
import { LoginModal } from '../../pages/LoginModal';
import { signup } from '../../utils/apiClient';
import { createUser } from '../../utils/testDataFactory';
import type { User } from '../../types/domain';

test.describe('@smoke Login — Demoblaze', () => {
  test.beforeEach(async ({ page, clearState }) => {
    await clearState();
    void page;
  });

  test('LOGIN-001 — User logs in with valid credentials @smoke', async ({ page, homePage }) => {
    const user: User = createUser();
    await signup(user);

    await homePage.open();
    await homePage.openLoginModal();
    await new LoginModal(page).login(user);

    await expect(page.locator('#nameofuser')).toContainText(`Welcome ${user.username}`, {
      timeout: 15000,
    });
    await expect(page.locator('#logout2')).toBeVisible();
    await expect(page.locator('#login2')).toBeHidden();
  });

  test('LOGIN-002 — User logs out after successful login @smoke', async ({ page, homePage }) => {
    const user: User = createUser();
    await signup(user);

    await homePage.open();
    await homePage.openLoginModal();
    await new LoginModal(page).login(user);
    await expect(page.locator('#nameofuser')).toContainText(`Welcome ${user.username}`);

    await page.locator('#logout2').click();

    await expect(page.locator('#login2')).toBeVisible();
    await expect(page.locator('#logout2')).toBeHidden();
    await expect(page.locator('#nameofuser')).toBeHidden();
  });

  test('LOGIN-003 — Login fails with wrong password', async ({ page, homePage, dialogSink }) => {
    const user: User = createUser();
    await signup(user);

    await homePage.open();
    await homePage.openLoginModal();

    await new LoginModal(page).fillCredentials({
      username: user.username,
      password: 'definitely-wrong',
    });
    await new LoginModal(page).submit();

    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe('Wrong password.');
    await expect(page.locator('#logInModal')).toBeVisible();
    await expect(page.locator('#nameofuser')).toBeHidden();
  });

  test('LOGIN-004 — Login fails for unknown user', async ({ page, homePage, dialogSink }) => {
    const fakeUser: User = { username: `qa_unknown_${Date.now()}`, password: 'P@ssw0rd!qa' };

    await homePage.open();
    await homePage.openLoginModal();
    await new LoginModal(page).login(fakeUser);

    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe('User does not exist.');
    await expect(page.locator('#logInModal')).toBeVisible();
  });

  test('LOGIN-005 — Submit empty form', async ({ page, homePage, dialogSink }) => {
    await homePage.open();
    await homePage.openLoginModal();

    // Track network calls to /login to assert none is made.
    const loginCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/login') && req.method() === 'POST') {
        loginCalls.push(req.url());
      }
    });

    await new LoginModal(page).submit();

    await expect
      .poll(() => dialogSink.last(), { timeout: 5000 })
      .toBe('Please fill out Username and Password.');
    expect(loginCalls).toEqual([]);
    await expect(page.locator('#logInModal')).toBeVisible();
  });
});
