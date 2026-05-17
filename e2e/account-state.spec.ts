import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/", { timeout: 10000 });
}

test.describe("Account-state messaging", () => {
  test("logged-out users see a login path before posting or reporting", async ({ page }) => {
    await page.goto("/forum/general-discussion/new");

    await expect(page.getByRole("status").filter({ hasText: "Log in to start a thread" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
    await expect(page.getByTestId("thread-title")).toHaveCount(0);

    await page.goto("/forum/general-discussion");
    await page.getByText(/Seed thread/).first().click();
    await expect(page.getByRole("status").filter({ hasText: "Log in to reply" }).first()).toBeVisible();
    await page.locator("article").first().getByRole("button", { name: "Report this content" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Log in to report content" }).first()).toBeVisible();
  });

  test("unverified users cannot post and can request verification", async ({ page }) => {
    await login(page, "unverified@example.com");

    await page.goto("/forum/general-discussion/new");
    await expect(page.getByRole("status").filter({ hasText: "Verify your email to continue" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Resend verification email" })).toBeVisible();
    await expect(page.getByTestId("thread-title")).toHaveCount(0);

    await page.getByRole("link", { name: "Resend verification email" }).click();
    await page.fill('input[name="email"]', "unverified@example.com");
    await page.getByRole("button", { name: "Resend verification email" }).click();
    await expect(
      page.getByText("If that account still needs verification, a new email has been sent."),
    ).toBeVisible();

    await page.goto("/forum/general-discussion");
    await page.getByText(/Seed thread/).first().click();
    await expect(page.getByRole("status").filter({ hasText: "Verify your email to continue" }).first()).toBeVisible();
    await expect(page.getByTestId("reply-content")).toHaveCount(0);
  });

  test("suspended users cannot post or report and see a blocked state", async ({ page }) => {
    await login(page, "suspended@example.com");

    await page.goto("/forum/general-discussion/new");
    await expect(page.getByRole("status").filter({ hasText: "This action is unavailable" }).first()).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Your account is suspended, so you cannot start a thread" }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("thread-title")).toHaveCount(0);

    await page.goto("/forum/general-discussion");
    await page.getByText(/Seed thread/).first().click();
    await expect(page.getByRole("status").filter({ hasText: "This action is unavailable" }).first()).toBeVisible();
    await expect(page.getByTestId("reply-content")).toHaveCount(0);

    await page.locator("article").first().getByRole("button", { name: "Report this content" }).click();
    await expect(page.getByText("Your account is suspended, so you cannot report content.")).toBeVisible();
  });
});
