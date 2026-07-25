import { test, expect } from "@playwright/test";

test.describe("Moderator direct thread actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "moderator@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });
  });

  test("thread management page loads with threads", async ({ page }) => {
    await page.goto("/admin/threads");
    await expect(page.getByRole("heading", { name: "Thread Management" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("body")).toContainText("Seed thread", { timeout: 10000 });
  });

  test("moderation queue loads with reports", async ({ page }) => {
    await page.goto("/admin/mod");
    await expect(page.locator("body")).toContainText("Moderation", { timeout: 10000 });
  });
});
