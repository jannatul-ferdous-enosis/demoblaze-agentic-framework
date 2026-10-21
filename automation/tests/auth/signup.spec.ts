/**
 * Signup — automated test suite for the Demoblaze Sign up modal.
 *
 * Source artifacts:
 *   - artifacts/requirements/signup.md
 *   - artifacts/test-cases/signup.json
 *   - artifacts/test-case-reviews/signup-review.md  (PASS WITH WARNINGS)
 *
 * Cases covered (automationCandidate: true for all):
 *   SIGNUP-001 (P0)  — Brand-new username signs up successfully
 *   SIGNUP-002 (P0)  — Newly signed-up user can log in immediately
 *   SIGNUP-003 (P0)  — Signup does NOT auto-authenticate the user
 *   SIGNUP-004 (P1)  — Signup fails for already-existing username
 *   SIGNUP-005 (P1)  — Submit empty form
 *   SIGNUP-006 (P2)  — Empty username, populated password
 *   SIGNUP-007 (P2)  — Populated username, empty password
 *   SIGNUP-008 (P2)  — Close modal without submitting
 *   SIGNUP-009 (P2)  — Allowed character classes for username and password
 *   SIGNUP-010 (P2)  — Sign up and Log in modals not open concurrently
 *   SIGNUP-011 (P1)  — Dialog handler observes signup alerts (regression)
 *
 * Selector source of truth: agent/qa-agent/selector-cheatsheet.md
 *
 * The dialog handler is installed by `baseFixture.ts` on the test page,
 * so Demoblaze's `alert()` calls are auto-accepted and captured into
 * `dialogSink.messages`. No `waitForTimeout` is used.
 */

import { test, expect } from '../../fixtures/baseFixture';
import { SignupModal } from '../../pages/SignupModal';
import { LoginModal } from '../../pages/LoginModal';
import { signup } from '../../utils/apiClient';
import { createUser } from '../../utils/testDataFactory';
import type { User } from '../../types/domain';

const SIGNUP_SUCCESS = 'Sign up successful.';
const SIGNUP_DUPLICATE = 'This user already exist.';
const SIGNUP_EMPTY = 'Please fill out Username and Password.';

test.describe('@smoke Signup — Demoblaze', () => {
  test.beforeEach(async ({ clearState }) => {
    await clearState();
  });

  test('SIGNUP-001 — User signs up with a brand-new username @smoke', async ({
    page,
    homePage,
    dialogSink,
  }) => {
    const user: User = createUser();

    await homePage.open();
    await homePage.openSignupModal();
    await new SignupModal(page).signup(user);

    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe(SIGNUP_SUCCESS);
    await expect(page.locator('#signInModal')).toBeVisible();
  });

  test('SIGNUP-002 — Newly signed-up user can immediately log in with the same credentials @smoke', async ({
    page,
    homePage,
    dialogSink,
  }) => {
    const user: User = createUser();

    // Step a: complete signup via the UI.
    await homePage.open();
    await homePage.openSignupModal();
    await new SignupModal(page).signup(user);
    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe(SIGNUP_SUCCESS);

    // Step b: close the Sign up modal via its header close button.
    await page.locator('#signInModal').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#signInModal')).toBeHidden();

    // Step c: open the Log in modal and log in with the same credentials.
    await homePage.openLoginModal();
    await new LoginModal(page).login(user);

    await expect(page.locator('#nameofuser')).toContainText(`Welcome ${user.username}`, {
      timeout: 15000,
    });
    await expect(page.locator('#logout2')).toBeVisible();
  });

  test('SIGNUP-003 — Signup does NOT auto-authenticate the user @smoke', async ({
    page,
    homePage,
    dialogSink,
  }) => {
    const user: User = createUser();

    await homePage.open();

    // Confirm logged-out navbar state before any signup interaction.
    await expect(page.locator('#login2')).toBeVisible();
    await expect(page.locator('#signin2')).toBeVisible();
    await expect(page.locator('#logout2')).toBeHidden();
    await expect(page.locator('#nameofuser')).toBeHidden();

    // Open the Sign up modal and submit brand-new credentials.
    await homePage.openSignupModal();
    await new SignupModal(page).signup(user);

    // Dismiss (auto-accept) the success alert.
    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe(SIGNUP_SUCCESS);

    // Close the Sign up modal via its header close button.
    await page.locator('#signInModal').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#signInModal')).toBeHidden();

    // Navbar MUST remain in the logged-out state — signup does NOT auto-login.
    await expect(page.locator('#login2')).toBeVisible();
    await expect(page.locator('#signin2')).toBeVisible();
    await expect(page.locator('#logout2')).toBeHidden();
    await expect(page.locator('#nameofuser')).toBeHidden();
  });

  test('SIGNUP-004 — Signup fails because the username already exists', async ({
    page,
    homePage,
    dialogSink,
  }) => {
    // Pre-register a user via the API so the UI signup is guaranteed
    // to hit the duplicate-user path.
    const user: User = createUser();
    const created = await signup(user);
    expect(created).toBe(true);

    await homePage.open();
    await homePage.openSignupModal();
    await new SignupModal(page).signup(user);

    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe(SIGNUP_DUPLICATE);
    await expect(page.locator('#signInModal')).toBeVisible();
  });

  test('SIGNUP-005 — Submit empty signup form', async ({ page, homePage, dialogSink }) => {
    await homePage.open();
    await homePage.openSignupModal();

    // Track network calls to /signup to assert none is made.
    const signupCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/signup') && req.method() === 'POST') {
        signupCalls.push(req.url());
      }
    });

    await new SignupModal(page).signup({ username: '', password: '' });

    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe(SIGNUP_EMPTY);
    expect(signupCalls).toEqual([]);
    await expect(page.locator('#signInModal')).toBeVisible();
  });

  test('SIGNUP-006 — Submit signup with empty username and populated password', async ({
    page,
    homePage,
    dialogSink,
  }) => {
    await homePage.open();
    await homePage.openSignupModal();
    await new SignupModal(page).signup({ username: '', password: 'P@ssw0rd!qa' });

    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe(SIGNUP_EMPTY);
    await expect(page.locator('#signInModal')).toBeVisible();
  });

  test('SIGNUP-007 — Submit signup with populated username and empty password', async ({
    page,
    homePage,
    dialogSink,
  }) => {
    const user: User = createUser();

    await homePage.open();
    await homePage.openSignupModal();
    await new SignupModal(page).signup({ username: user.username, password: '' });

    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe(SIGNUP_EMPTY);
    await expect(page.locator('#signInModal')).toBeVisible();
  });

  test('SIGNUP-008 — Close the Sign up modal without submitting', async ({ page, homePage }) => {
    const user: User = createUser();

    // Track any signup network call to assert NONE is made.
    const signupCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/signup') && req.method() === 'POST') {
        signupCalls.push(req.url());
      }
    });

    await homePage.open();
    await homePage.openSignupModal();

    // Fill credentials with brand-new values via raw locators, then close the modal
    // without clicking the Sign up submit button.
    await page.locator('#sign-username').fill(user.username);
    await page.locator('#sign-password').fill(user.password);

    // Click the modal's Close button to dismiss without submitting.
    await page.locator('#signInModal').getByRole('button', { name: 'Close' }).click();

    await expect(page.locator('#signInModal')).toBeHidden();
    expect(signupCalls).toEqual([]);
  });

  test('SIGNUP-009 — Username and password with allowed character classes are accepted', async ({
    page,
    homePage,
    dialogSink,
  }) => {
    const user: User = createUser({ prefix: 'qa_special' });
    user.password = 'P@ssw0rd!123';

    await homePage.open();
    await homePage.openSignupModal();
    await new SignupModal(page).signup(user);

    await expect.poll(() => dialogSink.last(), { timeout: 5000 }).toBe(SIGNUP_SUCCESS);
  });

  test('SIGNUP-010 — Sign up and Log in modals are not open at the same time', async ({
    page,
    homePage,
  }) => {
    await homePage.open();

    // Open the Log in modal first.
    await homePage.openLoginModal();
    await expect(page.locator('#logInModal')).toBeVisible();
    await expect(page.locator('#signInModal')).toBeHidden();

    // Close the Log in modal.
    await page.locator('#logInModal').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#logInModal')).toBeHidden();

    // Now open the Sign up modal.
    await homePage.openSignupModal();
    await expect(page.locator('#signInModal')).toBeVisible();
    await expect(page.locator('#logInModal')).toBeHidden();
  });

  test('SIGNUP-011 — Dialog handler sanity — signup alerts are catchable', async ({
    page,
    homePage,
    dialogSink,
  }) => {
    const user: User = createUser();

    await homePage.open();
    await homePage.openSignupModal();
    await new SignupModal(page).signup(user);

    // The dialog handler is provided by baseFixture — verifying it observes
    // a known signup alert proves the handler is wired correctly.
    await expect
      .poll(() => dialogSink.last(), { timeout: 5000 })
      .toMatch(/^(Sign up successful\.|This user already exist\.|Please fill out Username and Password\.)$/);
    await expect(page.locator('#signInModal')).toBeVisible();
    void page;
  });
});
