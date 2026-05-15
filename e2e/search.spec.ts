import { test, expect } from "@playwright/test";

test.describe("Search with filters", () => {
  test("basic search returns results", async ({ page }) => {
    await page.goto("/search");
    await page.fill('input[name="q"]', "seed thread");
    await page.click('button[type="submit"]');

    await expect(page.locator("body")).toContainText("Seed thread", { timeout: 10000 });
  });

  test("search with forum filter", async ({ page }) => {
    await page.goto("/search");
    await page.fill('input[name="q"]', "seed");
    await page.selectOption('select[name="forum"]', "general-discussion");
    await page.click('button[type="submit"]');

    await expect(page.locator("body")).toContainText("General Discussion", { timeout: 10000 });
  });

  test("empty search shows prompt", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("body")).toContainText("Enter a search term");
  });

  test("no results message shown", async ({ page }) => {
    await page.goto("/search?q=xylophonezzzzzzzzzzzzz");
    await expect(page.locator("body")).toContainText("No results found", { timeout: 10000 });
  });
});
