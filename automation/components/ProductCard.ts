/**
 * ProductCard — a single product card in the home grid or category grid.
 *
 * The card is rendered by index.js / prod.js. The card title link
 * navigates to `prod.html?idp_=<id>`.
 */

import type { Locator, Page } from '@playwright/test';

export class ProductCard {
  constructor(private readonly root: Locator) {}

  static in(page: Page, title: string): ProductCard {
    const card = page.locator('#tbodyid .card').filter({
      has: page.locator(`.card-title a`, { hasText: title }),
    });
    return new ProductCard(card);
  }

  static all(page: Page): Locator {
    return page.locator('#tbodyid .card');
  }

  static firstCard(page: Page): Locator {
    return page.locator('#tbodyid .card').first();
  }

  async clickTitle(): Promise<void> {
    await this.root.locator('.card-title a').click();
  }

  async getTitle(): Promise<string> {
    return (await this.root.locator('.card-title').textContent()) ?? '';
  }

  async getPrice(): Promise<string> {
    return (await this.root.locator('h5').textContent()) ?? '';
  }
}
