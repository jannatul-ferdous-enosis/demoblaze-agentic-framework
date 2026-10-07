/**
 * SignupModal — the Sign up Bootstrap modal.
 */

import type { Page, Locator } from '@playwright/test';
import type { User } from '../types/domain';

export class SignupModal {
  private readonly root: Locator;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#signInModal');
    this.usernameInput = page.locator('#sign-username');
    this.passwordInput = page.locator('#sign-password');
    this.submitButton = this.root.getByRole('button', { name: 'Sign up' });
  }

  async expectVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  async signup(user: User): Promise<void> {
    // Sequential: parallel `fill` calls on the same form can race the
    // value-commit and leave one of the fields empty at submit time.
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.submitButton.click();
  }
}
