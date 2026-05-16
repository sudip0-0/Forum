import { test, expect } from "@playwright/test";

test.describe("Moderation flows", () => {
  test("report content and moderator resolves", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "member2@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });

    await page.goto("/forum/general-discussion");
    await page.getByText(/Seed thread/).first().click();
    await page.waitForURL(/\/forum\/general-discussion\//, { timeout: 10000 });

    await page.getByRole("button", { name: "Report this content" }).first().click();
    await page.getByLabel("Reason").selectOption("SPAM");
    await page.getByLabel(/Additional details/).fill("E2E test report");
    await page.getByRole("button", { name: "Submit Report" }).click();

    await page.click('button:has-text("Logout")');
    await page.goto("/login");
    await page.fill('input[name="email"]', "moderator@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });

    await page.goto("/admin/mod");
    await expect(page.locator("body")).toContainText("Moderation", { timeout: 10000 });
    await page.goto("/admin/mod/history");
    await expect(page.locator("body")).toContainText("Moderation History", { timeout: 10000 });
  });
});
