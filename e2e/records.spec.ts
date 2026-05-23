import { test, expect } from "@playwright/test";
import { RecordsPage } from "./pages/RecordsPage";

test.describe("Records page", () => {
  test("renders with stat cards and record cards", async ({ page }) => {
    const recordsPage = new RecordsPage(page);
    await recordsPage.goto();

    await expect(recordsPage.heading).toHaveText("Record Book");

    const statCards = await recordsPage.statCards.count();
    expect(statCards).toBeGreaterThanOrEqual(4);

    const recordCards = await recordsPage.recordCards.count();
    expect(recordCards).toBeGreaterThanOrEqual(6);
  });
});
