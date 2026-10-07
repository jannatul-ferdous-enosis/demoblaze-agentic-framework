/**
 * ContactModal — the Contact modal.
 */

import type { Page, Locator } from '@playwright/test';

export interface ContactMessage {
  email: string;
  name: string;
  message: string;
}

export class ContactModal {
  private readonly root: Locator;
  private readonly emailInput: Locator;
  private readonly nameInput: Locator;
  private readonly messageInput: Locator;
  private readonly sendButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#exampleModal');
    this.emailInput = page.locator('#recipient-email');
    this.nameInput = page.locator('#recipient-name');
    this.messageInput = page.locator('#message-text');
    this.sendButton = this.root.getByRole('button', { name: 'Send message' });
  }

  async expectVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  async send(message: ContactMessage): Promise<void> {
    await this.emailInput.fill(message.email);
    await this.nameInput.fill(message.name);
    await this.messageInput.fill(message.message);
    await this.sendButton.click();
  }
}
