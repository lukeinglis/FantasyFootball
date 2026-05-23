import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("navigates between main pages via nav links", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Greybushes/);

    // NOTE: Selectors target visible text in the nav bar.
    // UNVERIFIED against real site; may need adjustment after manual E2E testing.
    const routes = [
      { link: "History", titleMatch: /History/ },
      { link: "Rules", titleMatch: /Rules/ },
    ];

    for (const route of routes) {
      await page.goto("/");
      await page.getByRole("link", { name: route.link }).first().click();
      await expect(page).toHaveTitle(route.titleMatch);
    }
  });

  test("logo navigates to home", async ({ page }) => {
    await page.goto("/history");
    await page.getByTestId("site-logo").click();
    await expect(page).toHaveURL("/");
  });
});
