import nodemailer from "nodemailer";
import type { EmailConfig } from "@/server/email/config";
import type { EmailMessage, EmailProvider } from "@/server/email/types";

export function createSmtpProvider(config: EmailConfig): EmailProvider {
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    ...(config.SMTP_USER || config.SMTP_PASS
      ? {
          auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          },
        }
      : {}),
  });

  return {
    async send(message: EmailMessage) {
      await transporter.sendMail({
        from: config.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    },
  };
}
