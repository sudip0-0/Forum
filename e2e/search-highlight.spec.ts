import { test, expect } from "@playwright/test";

test.describe("Search-to-thread navigation with highlights", () => {
  test("clicking search result navigates to correct thread with highlight param and fragment", async ({
    page,
  }) => {
    // Perform a search for a term that exists in seeded data
    await page.goto("/search");
    await page.fill('input[name="q"]', "seed thread");
    await page.click('button[type="submit"]');

    // Wait for results to appear
    await expect(page.locator("body")).toContainText("result", { timeout: 10000 });

    // Verify the first result link contains ?highlight= and #post- in the href
    const firstResultLink = page.locator('a[href*="?highlight="]').first();
    await expect(firstResultLink).toBeVisible({ timeout: 10000 });

    const href = await firstResultLink.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toContain("?highlight=");
    expect(href).toContain("#post-");
    expect(href).toContain("seed%20thread");

    // Click the result and verify navigation
    await firstResultLink.click();
    await page.waitForURL(/\/forum\/.*\?highlight=/, { timeout: 15000 });

    // Verify the URL has the highlight param
    const url = new URL(page.url());
    expect(url.searchParams.get("highlight")).toBe("seed thread");

    // Verify we're on a thread page (has a heading with thread title)
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });

  test("thread page scrolls to anchored post", async ({ page }) => {
    // Perform a search and navigate to a result
    await page.goto("/search");
    await page.fill('input[name="q"]', "seed thread");
    await page.click('button[type="submit"]');

    await expect(page.locator("body")).toContainText("result", { timeout: 10000 });

    const firstResultLink = page.locator('a[href*="?highlight="]').first();
    await expect(firstResultLink).toBeVisible({ timeout: 10000 });

    const href = await firstResultLink.getAttribute("href");
    expect(href).toBeTruthy();

    // Extract the post ID from the fragment
    const fragmentMatch = href!.match(/#post-(.+)$/);
    expect(fragmentMatch).toBeTruthy();
    const postId = fragmentMatch![1];

    // Navigate to the deep link
    await firstResultLink.click();
    await page.waitForURL(/\/forum\/.*\?highlight=/, { timeout: 15000 });

    // Verify the anchored post element exists and is visible
    const anchoredPost = page.locator(`article[id="post-${postId}"]`);
    await expect(anchoredPost).toBeVisible({ timeout: 10000 });

    // Verify the post is within the viewport (scrolled to)
    // Allow time for smooth scroll to complete
    await page.waitForTimeout(1000);
    const isInViewport = await anchoredPost.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top >= -100 && rect.top <= window.innerHeight;
    });
    expect(isInViewport).toBe(true);
  });

  test("dismiss control removes highlights and updates URL without reload", async ({
    page,
  }) => {
    // Navigate to a thread with highlight param
    await page.goto("/search");
    await page.fill('input[name="q"]', "seed thread");
    await page.click('button[type="submit"]');

    await expect(page.locator("body")).toContainText("result", { timeout: 10000 });

    const firstResultLink = page.locator('a[href*="?highlight="]').first();
    await expect(firstResultLink).toBeVisible({ timeout: 10000 });
    await firstResultLink.click();
    await page.waitForURL(/\/forum\/.*\?highlight=/, { timeout: 15000 });

    // Verify the dismiss banner is visible
    const dismissButton = page.getByRole("button", { name: "Dismiss search highlights" });
    await expect(dismissButton).toBeVisible({ timeout: 10000 });

    // Verify highlight text is shown in the banner
    await expect(page.getByRole("status").filter({ hasText: "Showing highlights for" })).toBeVisible();

    // Click dismiss
    await dismissButton.click();

    // Verify the highlight param is removed from the URL without page reload
    await expect(page).not.toHaveURL(/\?highlight=/, { timeout: 5000 });

    // Verify the dismiss banner is no longer visible
    await expect(dismissButton).not.toBeVisible();

    // Verify we're still on the same thread page (no reload happened)
    await expect(page.locator("h1")).toBeVisible();
  });

  test("invalid post anchor does not produce an error", async ({ page }) => {
    // Navigate directly to a thread with a non-existent post anchor
    // Use a known forum slug from seeded data
    await page.goto("/forum/general-discussion");
    await expect(
      page.getByRole("heading", { name: "General Discussion", exact: true }),
    ).toBeVisible({ timeout: 10000 });

    // Get the first thread link
    const threadLink = page.locator("a:has-text('Seed thread')").first();
    await expect(threadLink).toBeVisible({ timeout: 10000 });
    const threadHref = await threadLink.getAttribute("href");
    expect(threadHref).toBeTruthy();

    // Navigate to the thread with an invalid post anchor
    await page.goto(`${threadHref}?highlight=test#post-nonexistent-id-12345`);

    // Verify the page loads without error (use .first() since thread title may appear in multiple h1s)
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });

    // Verify no error page is displayed (no "Something went wrong" or similar error UI)
    await expect(page.locator("body")).not.toContainText("Something went wrong", { timeout: 3000 });

    // Verify the thread content is still rendered (posts are visible)
    await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
  });
});
