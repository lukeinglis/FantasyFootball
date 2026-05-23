import { type Locator, type Page } from "@playwright/test";

export class NavBar {
  readonly page: Page;
  readonly logo: Locator;
  readonly primaryNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.getByTestId("site-logo");
    this.primaryNav = page.locator('nav[aria-label="Primary"]');
  }

  async clickNavLink(label: string) {
    await this.primaryNav.getByRole("link", { name: label }).click();
  }
}
