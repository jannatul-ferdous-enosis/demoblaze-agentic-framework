/**
 * ProductPage — the product detail page (`prod.html?idp_=...`).
 */

import type { Page, Locator } from '@playwright/test';

export class ProductPage {
  readonly addToCartLink: Locator;
  readonly titleHeading: Locator;
  readonly price: Locator;
  readonly description: Locator;

  constructor(private readonly page: Page) {
    this.addToCartLink = page.getByRole('link', { name: 'Add to cart' });
    this.titleHeading = page.locator('#tbodyid h2.name');
    this.price = page.locator('#tbodyid .price-container');
    this.description = page.locator('#more-information');
  }

  async expectLoaded(): Promise<void> {
    await this.titleHeading.waitFor({ state: 'visible' });
  }

  async getTitle(): Promise<string> {
    return (await this.titleHeading.textContent()) ?? '';
  }

  async getPrice(): Promise<string> {
    return (await this.price.textContent()) ?? '';
  }

  async addToCart(): Promise<void> {
    // locator.click() auto-waits for actionability; no explicit waitFor.
    await this.addToCartLink.click();
  }
}
