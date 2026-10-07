/**
 * LoginModal — the Log in Bootstrap modal.
 *
 * Sits on every page. Selectors verified against the live DOM on 2026-10-08.
 */

import type { Page, Locator } from '@playwright/test';

export class LoginModal {
  private readonly root: Locator;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#logInModal');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.submitButton = this.root.getByRole('button', { name: 'Log in' });
    this.closeButton = this.root.getByRole('button', { name: 'Close' });
  }

  async expectVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  async fillCredentials(user: { username: string; password: string }): Promise<void> {
    // Sequential: parallel `fill` calls on the same form can race the
    // value-commit and leave one of the fields empty at submit time.
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(user: { username: string; password: string }): Promise<void> {
    await this.fillCredentials(user);
    await this.submit();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }
}
