import { expect, test } from "@playwright/test";

test.describe("Health Check", () => {
  test("should return healthy status", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe("healthy");
  });
});
