/**
 * PlaceOrderModal — the Place order modal on the cart page.
 */

import type { Page, Locator } from '@playwright/test';
import type { OrderData } from '../types/domain';

export class PlaceOrderModal {
  private readonly root: Locator;
  private readonly nameInput: Locator;
  private readonly countryInput: Locator;
  private readonly cityInput: Locator;
  private readonly cardInput: Locator;
  private readonly monthInput: Locator;
  private readonly yearInput: Locator;
  private readonly purchaseButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#orderModal');
    this.nameInput = page.locator('#name');
    this.countryInput = page.locator('#country');
    this.cityInput = page.locator('#city');
    this.cardInput = page.locator('#card');
    this.monthInput = page.locator('#month');
    this.yearInput = page.locator('#year');
    this.purchaseButton = this.root.getByRole('button', { name: 'Purchase' });
  }

  async expectVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  async fill(order: OrderData): Promise<void> {
    await this.nameInput.fill(order.name);
    await this.countryInput.fill(order.country);
    await this.cityInput.fill(order.city);
    await this.cardInput.fill(order.creditCard);
    await this.monthInput.fill(order.month);
    await this.yearInput.fill(order.year);
  }

  async purchase(): Promise<void> {
    await this.purchaseButton.click();
  }
}
