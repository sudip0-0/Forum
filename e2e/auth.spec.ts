import { test, expect } from "@playwright/test";

type MailpitMessageSummary = {
  ID: string;
  To: { Address: string }[];
  Subject: string;
};

type MailpitMessageDetail = MailpitMessageSummary & {
  Text: string;
};

async function findMailpitMessage(
  recipient: string,
  subject: string,
): Promise<MailpitMessageDetail> {
  await expect
    .poll(async () => {
      const response = await fetch("http://localhost:8025/api/v1/messages");
      const payload = (await response.json()) as { messages: MailpitMessageSummary[] };
      return payload.messages.find(
        (message) =>
          message.Subject === subject &&
          message.To.some((to) => to.Address === recipient),
      )?.ID;
    })
    .not.toBeUndefined();

  const response = await fetch("http://localhost:8025/api/v1/messages");
  const payload = (await response.json()) as { messages: MailpitMessageSummary[] };
  const summary = payload.messages.find(
    (message) =>
      message.Subject === subject &&
      message.To.some((to) => to.Address === recipient),
  );
  if (!summary) throw new Error(`No ${subject} email found for ${recipient}`);

  const detailResponse = await fetch(`http://localhost:8025/api/v1/message/${summary.ID}`);
  return (await detailResponse.json()) as MailpitMessageDetail;
}

function extractLink(text: string, path: string): string {
  const escapedPath = path.replace("/", "\\/");
  const match = text.match(new RegExp(`https?://\\S+${escapedPath}\\?token=[a-f0-9]+`));
  if (!match) throw new Error(`No ${path} link found in message`);
  return match[0];
}

test.describe("Authentication flows", () => {
  test("register → verify email using Mailpit", async ({ page }) => {
    const testUser = `e2e-${Date.now()}`;
    const email = `${testUser}@test.com`;

    await page.goto("/register");
    await page.fill('input[name="username"]', testUser);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Check your email")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(email)).toBeVisible();

    const message = await findMailpitMessage(email, "Verify your Forum email");
    await page.goto(extractLink(message.Text, "/verify-email"));
    await expect(page.getByText("Email verified")).toBeVisible();
  });

  test("login → logout", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "member1@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/", { timeout: 10000 });
    await expect(page.locator("header")).toContainText("Logout", { timeout: 5000 });

    await page.click('button:has-text("Logout")');
    await expect(page.locator("header")).not.toContainText("Logout", { timeout: 5000 });
  });

  test("forgot password returns a generic request-submitted state", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Forgot password?").click();
    await page.fill('input[name="email"]', "missing-user@example.com");
    await page.click('button[type="submit"]');
    await expect(
      page.getByText("If an account exists for that email, a password reset link has been sent."),
    ).toBeVisible();
  });

  test("password reset email link updates credentials", async ({ page }) => {
    const testUser = `reset-${Date.now()}`;
    const email = `${testUser}@test.com`;
    const originalPassword = "testpass123";
    const newPassword = "resetpass123";

    await page.goto("/register");
    await page.fill('input[name="username"]', testUser);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', originalPassword);
    await page.click('button[type="submit"]');
    await expect(page.getByText("Check your email")).toBeVisible({ timeout: 10000 });

    await page.goto("/forgot-password");
    await page.fill('input[name="email"]', email);
    await page.click('button[type="submit"]');
    await expect(
      page.getByText("If an account exists for that email, a password reset link has been sent."),
    ).toBeVisible();

    const message = await findMailpitMessage(email, "Reset your Forum password");
    await page.goto(extractLink(message.Text, "/reset-password"));
    await page.fill('input[name="password"]', newPassword);
    await page.click('button[type="submit"]');
    await expect(page.getByText("Your password has been reset successfully.")).toBeVisible();

    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', newPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });
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
