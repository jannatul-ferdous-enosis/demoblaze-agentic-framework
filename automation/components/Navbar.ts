/**
 * Navbar — top navigation present on every page.
 *
 * Selectors verified against the live Demoblaze DOM on 2026-10-08.
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class Navbar {
  constructor(private readonly page: Page) {}

  private get loginLink(): Locator {
    return this.page.locator('#login2');
  }

  private get signupLink(): Locator {
    return this.page.locator('#signin2');
  }

  private get logoutLink(): Locator {
    return this.page.locator('#logout2');
  }

  private get welcomeText(): Locator {
    return this.page.locator('#nameofuser');
  }

  private get cartLink(): Locator {
    return this.page.locator('#cartur');
  }

  async openLogin(): Promise<void> {
    await this.loginLink.click();
  }

  async openSignup(): Promise<void> {
    await this.signupLink.click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  async expectLoggedIn(username: string): Promise<void> {
    await expect(this.welcomeText).toContainText(username, { timeout: 15000 });
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.loginLink).toBeVisible();
    await expect(this.logoutLink).toBeHidden();
  }

  async getWelcomeText(): Promise<string> {
    return (await this.welcomeText.textContent()) ?? '';
  }
}
