import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect unauthenticated users to signin page", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("should display signin page with Google button", async ({ page }) => {
    await page.goto("/auth/signin");

    // Check if page has sign in content
    await expect(page.locator("text=Google")).toBeVisible();
  });

  test("should show error page for invalid callback", async ({ page }) => {
    await page.goto("/auth/error?error=OAuthCallback");

    // Should display error page
    await expect(page).toHaveURL(/\/auth\/error/);
  });
});
