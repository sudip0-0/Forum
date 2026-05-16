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
    await expect(page.locator("body")).toContainText("You are posting in General Discussion");

    const title = `E2E Test Thread ${Date.now()}`;
    await page.getByTestId("thread-title").fill(title);
    await page.getByTestId("thread-content").fill("This is an E2E test thread created by Playwright.");
    await page.getByRole("button", { name: "Create Thread" }).click();

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible({ timeout: 15000 });
  });

  test("reply to an existing thread", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await page.getByText(/Seed thread/).first().click();
    await page.waitForURL(/\/forum\/general-discussion\//, { timeout: 10000 });

    const replyContent = `E2E reply ${Date.now()}`;
    await page.getByTestId("reply-content").fill(replyContent);
    await page.getByText("Post reply").click();

    await expect(page.locator("article").filter({ hasText: replyContent }).last()).toBeVisible({ timeout: 20000 });
  });

  test("edit own thread title and body", async ({ page }) => {
    await page.goto("/forums");
    await page.click('a:has-text("General Discussion")');
    await page.click('a:has-text("New Thread")');
    const title = `Editable thread ${Date.now()}`;
    await page.getByTestId("thread-title").fill(title);
    await page.getByTestId("thread-content").fill("Original body for an editable E2E thread.");
    await page.getByRole("button", { name: "Create Thread" }).click();
    await expect(page.getByRole("heading", { level: 1, name: title }).first()).toBeVisible({ timeout: 15000 });

    const updatedTitle = `${title} updated`;
    await page.getByRole("button", { name: "Edit thread" }).click();
    await page.getByTestId("edit-thread-title").fill(updatedTitle);
    await page.getByTestId("edit-thread-content").fill("Updated body for the editable E2E thread.");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("heading", { level: 1, name: updatedTitle }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Updated body for the editable E2E thread.");
  });

  test("edit and delete own reply", async ({ page }) => {
    await page.goto("/forum/general-discussion");
    await page.getByText(/Seed thread/).first().click();
    const replyContent = `Editable reply ${Date.now()}`;
    await page.getByTestId("reply-content").fill(replyContent);
    await page.getByText("Post reply").click();
    const replyArticle = page.locator("article").filter({ hasText: replyContent }).last();
    await expect(replyArticle).toBeVisible({ timeout: 20000 });
    const replyArticleId = await replyArticle.getAttribute("id");
    expect(replyArticleId).toBeTruthy();
    const savedReplyArticle = page.locator(`article[id="${replyArticleId}"]`);

    const updatedReply = `${replyContent} updated`;
    await savedReplyArticle.getByRole("button", { name: "Edit", exact: true }).click();
    const editor = savedReplyArticle.locator('[data-testid^="edit-reply-"]');
    await editor.fill(updatedReply);
    await savedReplyArticle.getByText("Save reply").click();
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    const updatedReplyArticle = page.locator("article").filter({ hasText: updatedReply }).first();
    await expect(updatedReplyArticle).toBeVisible({ timeout: 10000 });

    page.once("dialog", (dialog) => dialog.accept());
    await updatedReplyArticle.getByText("Delete").click();
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    await expect(page.locator("article").filter({ hasText: updatedReply })).toHaveCount(0);
  });

  test("delete own zero-reply thread and redirect", async ({ page }) => {
    await page.goto("/forums");
    await page.click('a:has-text("General Discussion")');
    await page.click('a:has-text("New Thread")');
    const title = `Disposable thread ${Date.now()}`;
    await page.getByTestId("thread-title").fill(title);
    await page.getByTestId("thread-content").fill("This disposable thread has no replies.");
    await page.getByRole("button", { name: "Create Thread" }).click();
    await expect(page.getByRole("heading", { level: 1, name: title }).first()).toBeVisible({ timeout: 15000 });

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete thread" }).click();
    await expect(page).toHaveURL(/\/forum\/general-discussion$/);
    await expect(page.locator("body")).not.toContainText(title);
  });

  test("blocks deleting own thread once it has replies", async ({ page }) => {
    await page.goto("/forums");
    await page.click('a:has-text("General Discussion")');
    await page.click('a:has-text("New Thread")');
    await page.getByTestId("thread-title").fill(`Thread with reply ${Date.now()}`);
    await page.getByTestId("thread-content").fill("This thread will receive a reply before deletion.");
    await page.getByRole("button", { name: "Create Thread" }).click();
    await page.getByTestId("reply-content").fill("A reply that blocks author deletion.");
    await page.getByText("Post reply").click();
    await expect(page.locator("body")).toContainText("Threads with replies cannot be deleted by their author.");
    await expect(page.getByText("Delete thread")).toHaveCount(0);
  });
});
