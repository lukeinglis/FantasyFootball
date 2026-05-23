import { type Locator, type Page } from "@playwright/test";

export class RecordsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly statCards: Locator;
  readonly recordCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByTestId("page-title");
    this.statCards = page.getByTestId("stat-card");
    this.recordCards = page.getByTestId("record-card");
  }

  async goto() {
    await this.page.goto("/records");
  }
}
