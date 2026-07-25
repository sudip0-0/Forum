export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: true,
  });
}
