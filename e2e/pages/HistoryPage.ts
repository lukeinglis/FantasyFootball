import { type Locator, type Page } from "@playwright/test";

export class HistoryPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly timeline: Locator;
  readonly seasonCards: Locator;
  readonly beltTracker: Locator;
  readonly titleCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByTestId("page-title");
    this.timeline = page.getByTestId("history-timeline");
    this.seasonCards = page.getByTestId("season-card");
    this.beltTracker = page.getByTestId("belt-tracker");
    this.titleCount = page.getByTestId("title-count");
  }

  async goto() {
    await this.page.goto("/history");
  }

  async getSeasonYears(): Promise<string[]> {
    const years = await this.page.getByTestId("season-year").allTextContents();
    return years.map((y) => y.trim());
  }
}
