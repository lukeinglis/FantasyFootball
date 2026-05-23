import { test, expect } from "@playwright/test";
import { HistoryPage } from "./pages/HistoryPage";

test.describe("History page", () => {
  test("displays seasons with year badges", async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto();

    await expect(historyPage.heading).toHaveText("League History");
    await expect(historyPage.timeline).toBeVisible();

    const years = await historyPage.getSeasonYears();
    expect(years.length).toBeGreaterThanOrEqual(1);

    for (const y of ["2025", "2020", "2015"]) {
      expect(years).toContain(y);
    }
  });

  test("shows belt tracker and title count sidebars", async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto();

    await expect(historyPage.beltTracker).toBeVisible();
    await expect(historyPage.titleCount).toBeVisible();
  });
});
