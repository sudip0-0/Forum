import { z } from "zod";

const emailConfigSchema = z.object({
  EMAIL_PROVIDER: z.enum(["smtp"]).default("smtp"),
  EMAIL_FROM: z.string().min(1),
  APP_URL: z.string().url(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

export function resolveEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  return emailConfigSchema.parse({
    EMAIL_PROVIDER: env.EMAIL_PROVIDER,
    EMAIL_FROM: env.EMAIL_FROM,
    APP_URL: env.APP_URL ?? env.AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    SMTP_SECURE: env.SMTP_SECURE,
    SMTP_USER: env.SMTP_USER,
    SMTP_PASS: env.SMTP_PASS,
  });
}
