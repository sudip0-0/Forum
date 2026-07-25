import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/", { timeout: 10000 });
}

test.describe("Staff navigation", () => {
  test("shows Admin link for admin and hides it for members", async ({ page }) => {
    await login(page, "admin@example.com");
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Admin" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Mod queue" })).toBeVisible();

    await page.click('button:has-text("Logout")');
    await expect(page.locator("header")).not.toContainText("Logout", { timeout: 5000 });

    await login(page, "member1@example.com");
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Admin" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Mod queue" })).toHaveCount(0);
  });

  test("skip link targets main content", async ({ page }) => {
    await page.goto("/forums");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page.locator("#main-content")).toBeVisible();
  });
});
