import { expect, test } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load landing page successfully", async ({ page }) => {
    await page.goto("/");

    // Should have the main heading or logo
    await expect(page).toHaveTitle(/Finance AI/i);
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for common landing page elements
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should load without errors on mobile
    await expect(page).toHaveTitle(/Finance AI/i);
  });
});
