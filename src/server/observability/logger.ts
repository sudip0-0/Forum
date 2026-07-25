import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  base: { service: "forum" },
  redact: {
    paths: [
      "password",
      "passwordHash",
      "AUTH_SECRET",
      "SMTP_PASS",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    remove: true,
  },
});

export function createRequestLogger(fields: {
  requestId?: string;
  route?: string;
  userId?: string;
}) {
  return logger.child(fields);
}
