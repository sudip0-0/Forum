import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const e2ePort = new URL(baseURL).port || "80";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: `pnpm build && pnpm exec next start -p ${e2ePort}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 30000,
        env: {
          ...process.env,
          E2E: "true",
          AUTH_URL: baseURL,
          APP_URL: baseURL,
          NEXT_PUBLIC_APP_URL: baseURL,
          EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? "smtp",
          EMAIL_FROM: process.env.EMAIL_FROM ?? "Forum <no-reply@example.com>",
          SMTP_HOST: process.env.SMTP_HOST ?? "localhost",
          SMTP_PORT: process.env.SMTP_PORT ?? "1025",
          SMTP_SECURE: process.env.SMTP_SECURE ?? "false",
          SMTP_USER: process.env.SMTP_USER ?? "",
          SMTP_PASS: process.env.SMTP_PASS ?? "",
        },
      },
});
