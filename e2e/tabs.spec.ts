import { test, expect } from "@playwright/test";

test.describe("Tab navigation", () => {
  test.describe("Draft page tabs", () => {
    test("defaults to Board tab", async ({ page }) => {
      await page.goto("/draft");
      const boardTab = page.getByRole("tab", { name: "Board" });
      await expect(boardTab).toHaveAttribute("aria-selected", "true");
    });

    test("switches to History tab and updates URL", async ({ page }) => {
      await page.goto("/draft");
      await page.getByRole("tab", { name: "History" }).click();
      await expect(page).toHaveURL(/tab=history/);
      await expect(
        page.getByRole("tab", { name: "History" }),
      ).toHaveAttribute("aria-selected", "true");
    });

    test("switches to Insights tab", async ({ page }) => {
      await page.goto("/draft");
      await page.getByRole("tab", { name: "Insights" }).click();
      await expect(page).toHaveURL(/tab=insights/);
    });

    test("switches to Trends tab", async ({ page }) => {
      await page.goto("/draft");
      await page.getByRole("tab", { name: "Trends" }).click();
      await expect(page).toHaveURL(/tab=trends/);
    });
  });

  test.describe("Records page tabs", () => {
    test("defaults to Records tab", async ({ page }) => {
      await page.goto("/records");
      const recordsTab = page.getByRole("tab", { name: "Records" });
      await expect(recordsTab).toHaveAttribute("aria-selected", "true");
    });

    test("switches to Awards tab", async ({ page }) => {
      await page.goto("/records");
      await page.getByRole("tab", { name: "Awards" }).click();
      await expect(page).toHaveURL(/tab=awards/);
    });

    test("switches to Hall of Shame tab", async ({ page }) => {
      await page.goto("/records");
      await page.getByRole("tab", { name: "Hall of Shame" }).click();
      await expect(page).toHaveURL(/tab=hall-of-shame/);
    });
  });

  test.describe("League page tabs", () => {
    test("defaults to Rules tab", async ({ page }) => {
      await page.goto("/league");
      const rulesTab = page.getByRole("tab", { name: "Rules" });
      await expect(rulesTab).toHaveAttribute("aria-selected", "true");
    });

    test("switches to Payouts tab", async ({ page }) => {
      await page.goto("/league");
      await page.getByRole("tab", { name: "Payouts" }).click();
      await expect(page).toHaveURL(/tab=payouts/);
    });
  });

  test.describe("Redirects from old routes", () => {
    test("/draft-history redirects to /draft with history tab", async ({
      page,
    }) => {
      await page.goto("/draft-history");
      await expect(page).toHaveURL(/\/draft/);
    });

    test("/wall-of-shame redirects to /records", async ({ page }) => {
      await page.goto("/wall-of-shame");
      await expect(page).toHaveURL(/\/records/);
    });

    test("/rules redirects to /league", async ({ page }) => {
      await page.goto("/rules");
      await expect(page).toHaveURL(/\/league/);
    });

    test("/members redirects to /managers", async ({ page }) => {
      await page.goto("/members");
      await expect(page).toHaveURL(/\/managers/);
    });
  });
});
