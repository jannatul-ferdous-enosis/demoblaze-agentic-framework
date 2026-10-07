/**
 * HomePage — the Demoblaze storefront root (`index.html`).
 *
 * Selectors verified against the live DOM on 2026-10-08.
 */

import type { Page } from '@playwright/test';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';

export class HomePage {
  readonly navbar: Navbar;

  constructor(private readonly page: Page) {
    this.navbar = new Navbar(page);
  }

  async open(): Promise<void> {
    // Use 'domcontentloaded' to avoid waiting for images and HLS video
    // which Demoblaze loads lazily and can take 30+ seconds.
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    // The product grid is rendered by index.js after the entries fetch.
    // Wait for at least one card to appear.
    await this.page.locator('#tbodyid .card').first().waitFor({ state: 'visible', timeout: 20000 });
  }

  async openLoginModal(): Promise<void> {
    await this.navbar.openLogin();
    await this.page.locator('#logInModal').waitFor({ state: 'visible' });
  }

  async openSignupModal(): Promise<void> {
    await this.navbar.openSignup();
    await this.page.locator('#signInModal').waitFor({ state: 'visible' });
  }

  async openCart(): Promise<void> {
    await this.navbar.openCart();
  }

  async clickProductByTitle(title: string): Promise<void> {
    const card = ProductCard.in(this.page, title);
    await card.clickTitle();
  }

  async openFirstProduct(): Promise<void> {
    await ProductCard.firstCard(this.page).locator('.card-title a').click();
  }

  async clickCategory(name: 'Phones' | 'Laptops' | 'Monitors'): Promise<void> {
    await this.page.getByRole('link', { name, exact: true }).first().click();
    await this.page.locator('#tbodyid .card').first().waitFor({ state: 'visible' });
  }
}
