import { test, expect } from "@playwright/test";

test.describe("Thread creation and replies", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "member1@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });
  });

  test("create thread in a forum", async ({ page }) => {
    await page.goto("/forums");
    await page.click('a:has-text("General Discussion")');
    await page.click('a:has-text("New Thread")');
    await page.waitForURL(/\/new$/, { timeout: 10000 });

    const title = `E2E Test Thread ${Date.now()}`;
    await page.getByTestId("thread-title").fill(title);
    await page.getByTestId("thread-content").fill("This is an E2E test thread created by Playwright.");
    await page.getByText("Create Thread").click();

    await expect(page.locator("h1")).toContainText(title, { timeout: 15000 });
  });

  test("reply to an existing thread", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await page.getByText(/Seed thread/).first().click();
    await page.waitForURL(/\/forum\/general-discussion\//, { timeout: 10000 });

    const replyContent = `E2E reply ${Date.now()}`;
    await page.getByTestId("reply-content").fill(replyContent);
    await page.getByText("Post reply").click();

    await expect(page.locator("body")).toContainText(replyContent, { timeout: 10000 });
  });
});
