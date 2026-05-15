import { test, expect, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  if (page.url().endsWith("/admin")) return;
  await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  if (page.url().endsWith("/login")) {
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
  }
  await expect(page).toHaveURL("/admin", { timeout: 10000 });
}

test.describe("Admin dashboard and navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin dashboard renders stat cards and quick actions", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("Admin Dashboard", { timeout: 10000 });

    await expect(page.locator("text=Total Users")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Visible Threads")).toBeVisible();
    await expect(page.locator("text=Open Reports")).toBeVisible();
    await expect(page.locator("text=Visible Forums")).toBeVisible();

    await expect(page.locator("text=Structure Manager")).toBeVisible();
    await expect(page.locator("text=Thread Management")).toBeVisible();
    await expect(page.locator("text=Moderation Queue")).toBeVisible();
    await expect(page.locator("text=Moderation History")).toBeVisible();
    await expect(page.locator("text=Manage Users")).toBeVisible();
  });

  test("admin subpages have back buttons that navigate to /admin", async ({ page }) => {
    const subpages = [
      "/admin/structure",
      "/admin/threads",
      "/admin/mod",
      "/admin/mod/history",
      "/admin/users",
    ];

    for (const url of subpages) {
      await page.goto(url);
      await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

      const backLink = page.locator("a:has-text('Back to Dashboard')");
      await expect(backLink).toBeVisible({ timeout: 5000 });

      await backLink.click();
      await expect(page).toHaveURL("/admin", { timeout: 10000 });
    }
  });
});

test.describe("Category pages and breadcrumbs", () => {
  test("category page renders with breadcrumbs and forums", async ({ page }) => {
    await page.goto("/category/general");
    await expect(page.locator("h1")).toContainText("General", { timeout: 10000 });

    await expect(page.locator("nav[aria-label='Breadcrumb']")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("link", { name: "Forums" })).toBeVisible();
    await expect(page.getByRole("link", { name: /General Discussion Questions/ })).toBeVisible();
  });

  test("forum page shows breadcrumbs", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.locator("h1")).toContainText("General Discussion", { timeout: 10000 });

    const breadcrumb = page.locator("nav[aria-label='Breadcrumb']");
    await expect(breadcrumb).toBeVisible({ timeout: 5000 });
    await expect(breadcrumb).toContainText("Forums");
    await expect(breadcrumb).toContainText("Community");
    await expect(breadcrumb).toContainText("General");
  });

  test("thread page shows breadcrumbs", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await page.locator("a:has-text('Seed thread')").first().click();
    await page.waitForURL(/\/forum\/general-discussion\//, { timeout: 10000 });

    const breadcrumb = page.locator("nav[aria-label='Breadcrumb']");
    await expect(breadcrumb).toBeVisible({ timeout: 5000 });
    await expect(breadcrumb).toContainText("Forums");
    await expect(breadcrumb).toContainText("Community");
    await expect(breadcrumb).toContainText("General");
    await expect(breadcrumb).toContainText("General Discussion");
  });
});

test.describe("Clickable tags", () => {
  test("clicking a tag on home page navigates to tag page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Latest discussions", { timeout: 10000 });

    const tagLink = page.locator("a[href^='/tags/']").first();
    await expect(tagLink).toBeVisible({ timeout: 5000 });

    const href = await tagLink.getAttribute("href");
    await tagLink.click();
    await expect(page).toHaveURL(href!, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("#", { timeout: 5000 });
  });

  test("tag page shows matching threads", async ({ page }) => {
    await page.goto("/tags/nextjs");
    await expect(page.locator("h1")).toContainText("#nextjs", { timeout: 10000 });

    const threadLinks = page.locator("a[href^='/forum/']");
    await expect(threadLinks.first()).toBeVisible({ timeout: 5000 });
  });

  test("clicking tag on forum listing navigates to tag page", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.locator("h1")).toContainText("General Discussion", { timeout: 10000 });

    const tagLink = page.locator("a[href^='/tags/']").first();
    await expect(tagLink).toBeVisible({ timeout: 5000 });

    const href = await tagLink.getAttribute("href");
    await tagLink.click();
    await expect(page).toHaveURL(href!, { timeout: 10000 });
  });
});

test.describe("Forum filters", () => {
  test("filter toggle opens filter form", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.locator("h1")).toContainText("General Discussion", { timeout: 10000 });

    await page.locator("button:has-text('Filters')").click();
    await expect(page.locator("select[name='sort']")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("select[name='direction']")).toBeVisible();
    await expect(page.locator("input[name='tagSlug']")).toBeVisible();
    await expect(page.locator("input[name='authorUsername']")).toBeVisible();
    await expect(page.locator("input[name='pinnedOnly']")).toBeVisible();
    await expect(page.locator("input[name='unanswered']")).toBeVisible();
  });

  test("filter form changes thread listing", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.locator("h1")).toContainText("General Discussion", { timeout: 10000 });

    await page.locator("button:has-text('Filters')").click();
    await page.locator("select[name='sort']").selectOption("title");
    await page.getByRole("button", { name: "Filter", exact: true }).click();

    await page.waitForURL(/sort=title/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("General Discussion");
  });
});

test.describe("View count dedup", () => {
  test("refreshing thread page does not double-count view", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.locator("h1")).toContainText("General Discussion", { timeout: 10000 });

    const firstViewRecorded = page.waitForResponse((response) =>
      response.url().includes("/api/trpc/thread.incrementView") && response.ok(),
    );
    await page.locator("a:has-text('Seed thread')").first().click();
    await page.waitForURL(/\/forum\/general-discussion\//, { timeout: 10000 });
    await firstViewRecorded;

    const viewsText = await page.locator("text=/\\d+ views/").first().textContent();
    expect(viewsText).toBeTruthy();
    const initialViews = Number.parseInt(viewsText!, 10);

    await page.reload();
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    const viewsAfterFirstRefresh = await page.locator("text=/\\d+ views/").first().textContent();
    expect(viewsAfterFirstRefresh).toBeTruthy();
    expect(Number.parseInt(viewsAfterFirstRefresh!, 10)).toBe(initialViews + 1);

    await page.reload();
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    const viewsAfterSecondRefresh = await page.locator("text=/\\d+ views/").first().textContent();
    expect(viewsAfterSecondRefresh).toBeTruthy();
    expect(Number.parseInt(viewsAfterSecondRefresh!, 10)).toBe(initialViews + 1);
  });
});
