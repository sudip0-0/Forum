import { resolveEmailConfig, type EmailConfig } from "@/server/email/config";
import { createSmtpProvider } from "@/server/email/providers/smtp";
import { buildPasswordResetEmail, buildVerificationEmail } from "@/server/email/templates";
import type { EmailProvider, PasswordResetEmailInput, VerificationEmailInput } from "@/server/email/types";

export function createEmailProvider(config: EmailConfig): EmailProvider {
  switch (config.EMAIL_PROVIDER) {
    case "smtp":
      return createSmtpProvider(config);
  }
}

function getEmailProvider() {
  return createEmailProvider(resolveEmailConfig());
}

export async function sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
  await getEmailProvider().send(buildVerificationEmail(input));
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  await getEmailProvider().send(buildPasswordResetEmail(input));
}
