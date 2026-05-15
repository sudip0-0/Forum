import { test, expect } from "@playwright/test";

test.describe("Authentication flows", () => {
  test("register → login → logout", async ({ page }) => {
    const testUser = `e2e-${Date.now()}`;

    await page.goto("/register");
    await page.fill('input[name="username"]', testUser);
    await page.fill('input[name="email"]', `${testUser}@test.com`);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/", { timeout: 10000 });
    await page.click('button:has-text("Logout")');
    await page.goto("/login");

    await page.fill('input[name="email"]', "member1@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/", { timeout: 10000 });
    await expect(page.locator("header")).toContainText("Logout", { timeout: 5000 });

    await page.click('button:has-text("Logout")');
    await expect(page.locator("header")).not.toContainText("Logout", { timeout: 5000 });
  });

  test("login with seeded member", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "member1@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/", { timeout: 10000 });
    await expect(page.locator("header")).toContainText("Logout");
  });

  test("redirects to login for protected pages", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
