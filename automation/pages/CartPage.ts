/**
 * CartPage — the cart page (`cart.html`).
 */

import type { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly tableBody: Locator;
  readonly total: Locator;
  readonly placeOrderButton: Locator;

  constructor(private readonly page: Page) {
    this.tableBody = page.locator('#tbodyid');
    this.total = page.locator('#totalp');
    this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
  }

  async open(): Promise<void> {
    await this.page.goto('/cart.html', { waitUntil: 'domcontentloaded' });
    await this.tableBody.waitFor({ state: 'visible', timeout: 15000 });
  }

  async getRowCount(): Promise<number> {
    return await this.tableBody.locator('tr').count();
  }

  async getTotalText(): Promise<string> {
    return (await this.total.textContent()) ?? '';
  }

  async deleteRow(index = 0): Promise<void> {
    const row = this.tableBody.locator('tr').nth(index);
    await row.locator('a', { hasText: 'Delete' }).click();
  }

  async openPlaceOrderModal(): Promise<void> {
    await this.placeOrderButton.click();
    await this.page.locator('#orderModal').waitFor({ state: 'visible' });
  }
}
