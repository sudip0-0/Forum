import { test, expect, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login?callbackUrl=/admin");
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/admin", { timeout: 10000 });
}

test.describe("Admin structure management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin dashboard shows all management links", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator('a:has-text("Structure Manager")')).toBeVisible();
    await expect(page.locator('a:has-text("Thread Management")')).toBeVisible();
    await expect(page.locator('a:has-text("Moderation Queue")')).toBeVisible();
    await expect(page.locator('a:has-text("Moderation History")')).toBeVisible();
    await expect(page.locator('a:has-text("Manage Users")')).toBeVisible();
  });

  test("structure manager loads", async ({ page }) => {
    await page.goto("/admin/structure");
    await expect(page.getByRole("heading", { name: "Structure Manager" }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("body")).toContainText("Community");
    await expect(page.locator("body")).toContainText("Help & Building");
  });

  test("user management shows user list", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Manage Users" }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("body")).toContainText("admin", { timeout: 10000 });
    await expect(page.locator("body")).toContainText("moderator");
  });

  test("moderation history page loads", async ({ page }) => {
    await page.goto("/admin/mod/history");
    await expect(page.getByRole("heading", { name: "Moderation History" }).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("suspension requires a reason", async ({ page }) => {
    await page.goto("/admin/users");
    const input = page.getByTestId("suspension-reason-member5").first();
    const row = input.locator("xpath=ancestor::tr");
    await expect(row.getByRole("button", { name: "Suspend" }).first()).toBeDisabled();
    await input.fill("Repeated spam");
    await expect(row.getByRole("button", { name: "Suspend" }).first()).toBeEnabled();
  });
});
