import { describe, expect, it } from "vitest";
import { resolveEmailConfig } from "@/server/email/config";
import { createEmailProvider } from "@/server/email";
import {
  buildPasswordResetEmail,
  buildVerificationEmail,
} from "@/server/email/templates";

const env = {
  NODE_ENV: "test" as const,
  EMAIL_PROVIDER: "smtp",
  EMAIL_FROM: "Forum <no-reply@example.com>",
  APP_URL: "http://localhost:3000",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_SECURE: "false",
  SMTP_USER: "",
  SMTP_PASS: "",
};

describe("email service", () => {
  it("resolves the SMTP provider config", () => {
    const config = resolveEmailConfig(env);
    expect(config).toMatchObject({
      EMAIL_PROVIDER: "smtp",
      SMTP_HOST: "localhost",
      SMTP_PORT: 1025,
      SMTP_SECURE: false,
    });
    expect(createEmailProvider(config)).toEqual({ send: expect.any(Function) });
  });

  it("builds a verification email payload", () => {
    expect(
      buildVerificationEmail({
        to: "member@example.com",
        verificationUrl: "http://localhost:3000/verify-email?token=abc",
      }),
    ).toMatchObject({
      to: "member@example.com",
      subject: "Verify your Forum email",
      text: expect.stringContaining("/verify-email?token=abc"),
    });
  });

  it("builds a password reset email payload", () => {
    expect(
      buildPasswordResetEmail({
        to: "member@example.com",
        resetUrl: "http://localhost:3000/reset-password?token=abc",
      }),
    ).toMatchObject({
      to: "member@example.com",
      subject: "Reset your Forum password",
      text: expect.stringContaining("/reset-password?token=abc"),
    });
  });
});
