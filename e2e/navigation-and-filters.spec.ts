import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function loginAsAdmin(page: Page) {
  await page.goto("/login?callbackUrl=/admin");
  await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/admin", { timeout: 10000 });
}

test.describe("Admin dashboard and navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin dashboard renders stat cards and quick actions", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" }).first()).toBeVisible({
      timeout: 10000,
    });

    await expect(page.locator(".stat-label", { hasText: "Users" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(".stat-label", { hasText: "Threads" }).first()).toBeVisible();
    await expect(page.getByText("Open Reports").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /\d+ Forums/ }).first()).toBeVisible();

    await expect(page.getByRole("link", { name: /Structure Manager/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Thread Management/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Moderation Queue/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Moderation History/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /User Management|Manage Users/ }).first()).toBeVisible();
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
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });

      const backLink = page.getByRole("link", { name: "Back to Dashboard" }).first();
      await expect(backLink).toBeVisible({ timeout: 5000 });

      await Promise.all([
        page.waitForURL("**/admin", { timeout: 10000 }),
        backLink.click(),
      ]);
    }
  });
});

test.describe("Category pages and breadcrumbs", () => {
  test("category page renders with breadcrumbs and forums", async ({ page }) => {
    await page.goto("/category/general");
    await expect(page.getByRole("heading", { name: "General", exact: true })).toBeVisible({ timeout: 10000 });

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" }).first();
    await expect(breadcrumb).toBeVisible({ timeout: 5000 });
    await expect(
      breadcrumb.getByRole("link", { name: "Forums", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /General Discussion Questions/ })).toBeVisible();
  });

  test("forum page shows breadcrumbs", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.getByRole("heading", { name: "General Discussion", exact: true })).toBeVisible({ timeout: 10000 });

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" }).first();
    await expect(breadcrumb).toBeVisible({ timeout: 5000 });
    await expect(breadcrumb).toContainText("Forums");
    await expect(breadcrumb).toContainText("Community");
    await expect(breadcrumb).toContainText("General");
  });

  test("thread page shows breadcrumbs", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await page.locator("a:has-text('Seed thread')").first().click();
    await page.waitForURL(/\/forum\/general-discussion\//, { timeout: 10000 });

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" }).first();
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
    await expect(page.locator("h1")).toContainText("Welcome to the Forums", { timeout: 10000 });

    const tagLink = page.locator("a[href^='/tags/']").first();
    await expect(tagLink).toBeVisible({ timeout: 5000 });

    const href = await tagLink.getAttribute("href");
    await tagLink.click();
    await expect(page).toHaveURL(href!, { timeout: 10000 });
    // URL navigation is the contract here; tag-page rendering is covered below with a stable fixture tag.
  });

  test("tag page shows matching threads", async ({ page }) => {
    await page.goto("/tags/nextjs");
    await expect(page.getByRole("heading", { name: "nextjs", exact: true }).first()).toBeVisible({ timeout: 10000 });

    const threadLinks = page.locator("a[href^='/forum/']");
    await expect(threadLinks.first()).toBeVisible({ timeout: 5000 });
  });

  test("clicking tag on forum listing navigates to tag page", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.getByRole("heading", { name: "General Discussion", exact: true }).first()).toBeVisible({ timeout: 10000 });

    const tagLink = page.locator("a[href^='/tags/']").first();
    await expect(tagLink).toBeVisible({ timeout: 5000 });

    const href = await tagLink.getAttribute("href");
    await tagLink.click();
    await expect(page).toHaveURL(href!, { timeout: 10000 });
  });
});

test.describe("Forum filters", () => {
  test("filter toggle exposes expanded state and opens from keyboard", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    const toggle = page.getByRole("button", { name: "Filters" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("select[name='sort']")).toBeVisible();
  });

  test("filter toggle opens filter form", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.getByRole("heading", { name: "General Discussion", exact: true })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await expect(page.locator("select[name='sort']")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("select[name='direction']")).toBeVisible();
    await expect(page.locator("input[name='tagSlug']")).toBeVisible();
    await expect(page.locator("input[name='authorUsername']")).toBeVisible();
    await expect(page.locator("input[name='pinnedOnly']")).toBeVisible();
    await expect(page.locator("input[name='unanswered']")).toBeVisible();
  });

  test("filter form changes thread listing", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.getByRole("heading", { name: "General Discussion", exact: true })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page.locator("select[name='sort']").selectOption("title");
    await page.getByRole("button", { name: "Filter", exact: true }).click();

    await page.waitForURL(/sort=title/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "General Discussion", exact: true }).first()).toBeVisible();
  });

  test("forum thread list paginates with next page control", async ({ page }) => {
    const forum = await prisma.forum.findUniqueOrThrow({ where: { slug: "general-discussion" } });
    const author = await prisma.user.findUniqueOrThrow({ where: { username: "member1" } });
    const createdAtBase = new Date("2026-05-16T00:00:00.000Z");

    for (let index = 0; index < 22; index += 1) {
      const title = `Pagination E2E thread ${index + 1}`;
      await prisma.thread.upsert({
        where: { slug: `pagination-e2e-thread-${index + 1}` },
        update: {
          isDeleted: false,
          lastActivityAt: new Date(createdAtBase.getTime() + index * 60000),
        },
        create: {
          forumId: forum.id,
          authorId: author.id,
          title,
          slug: `pagination-e2e-thread-${index + 1}`,
          createdAt: new Date(createdAtBase.getTime() + index * 60000),
          lastActivityAt: new Date(createdAtBase.getTime() + index * 60000),
          posts: {
            create: {
              authorId: author.id,
              content: `Opening post for ${title}.`,
              createdAt: new Date(createdAtBase.getTime() + index * 60000),
            },
          },
        },
      });
    }

    await page.goto("/forum/general-discussion");
    await expect(page.getByRole("heading", { name: "General Discussion", exact: true })).toBeVisible({ timeout: 10000 });

    const nextPage = page.getByRole("link", { name: "Next page" });
    await expect(nextPage).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForURL(/cursor=/, { timeout: 10000 }),
      nextPage.click(),
    ]);

    await expect(page.getByRole("heading", { name: "General Discussion", exact: true })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("cursor")).toBeTruthy();
  });
});

test.describe("Thread filters", () => {
  test("thread filter toggle opens sorting controls", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await page.locator("a:has-text('Seed thread')").first().click();
    await page.waitForURL(/\/forum\/general-discussion\//, { timeout: 10000 });

    await page.getByRole("button", { name: /Thread filters/i }).click();
    await expect(page.locator("select[name='postSort']")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("input[name='repliesOnly']")).toBeVisible();
  });
});

test.describe("View count dedup", () => {
  test("refreshing thread page does not double-count view", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await expect(page.getByRole("heading", { name: "General Discussion", exact: true }).first()).toBeVisible({ timeout: 10000 });

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

test.afterAll(async () => {
  await prisma.$disconnect();
});
