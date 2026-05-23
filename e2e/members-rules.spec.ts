import { test, expect } from "@playwright/test";

test.describe("Members page", () => {
  test("loads and displays active members", async ({ page }) => {
    await page.goto("/members");

    await expect(page.getByTestId("page-title")).toHaveText("Members");
    await expect(page.getByTestId("members-active")).toBeVisible();

    const memberCards = page.getByTestId("member-card");
    const count = await memberCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Rules page", () => {
  test("loads and displays rule sections", async ({ page }) => {
    await page.goto("/rules");

    await expect(page.getByTestId("page-title")).toHaveText("League Rules");

    const sections = page.getByTestId("rules-section");
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(sections.first()).toBeVisible();
  });
});
