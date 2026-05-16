import type { EmailMessage, PasswordResetEmailInput, VerificationEmailInput } from "@/server/email/types";

export function buildVerificationEmail(input: VerificationEmailInput): EmailMessage {
  return {
    to: input.to,
    subject: "Verify your Forum email",
    text: [
      "Welcome to Forum.",
      "",
      "Verify your email address by opening this link:",
      input.verificationUrl,
      "",
      "This link expires in 24 hours. If you did not create this account, you can ignore this email.",
    ].join("\n"),
  };
}

export function buildPasswordResetEmail(input: PasswordResetEmailInput): EmailMessage {
  return {
    to: input.to,
    subject: "Reset your Forum password",
    text: [
      "We received a request to reset your Forum password.",
      "",
      "Choose a new password by opening this link:",
      input.resetUrl,
      "",
      "This link expires in 1 hour. If you did not request a password reset, you can ignore this email.",
    ].join("\n"),
  };
}
