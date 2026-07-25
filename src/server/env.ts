import { z } from "zod";

const PLACEHOLDER_SECRETS = new Set([
  "replace-with-local-secret",
  "changeme",
  "secret",
]);

function isStrictProductionRuntime(
  nodeEnv: string | undefined,
  processEnv: NodeJS.ProcessEnv = process.env,
): boolean {
  // Skip strict checks during `next build` page collection.
  if (processEnv.NEXT_PHASE === "phase-production-build") {
    return false;
  }
  // Local/CI Playwright starts `next start` with E2E=true; allow non-redis backends.
  if (processEnv.E2E === "true") {
    return false;
  }
  return nodeEnv === "production";
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
    AUTH_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    APP_URL: z.string().url().optional(),
    REDIS_URL: z.string().optional(),
    RATE_LIMIT_BACKEND: z.enum(["redis", "memory"]).optional(),
    RATE_LIMIT_IN_MEMORY_FALLBACK: z.enum(["true", "false"]).optional(),
    E2E: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    RUN_INTEGRATION: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!isStrictProductionRuntime(data.NODE_ENV)) return;

    if (data.AUTH_SECRET.length < 32) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "AUTH_SECRET must be at least 32 characters in production",
      });
    }
    if (PLACEHOLDER_SECRETS.has(data.AUTH_SECRET.toLowerCase())) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "AUTH_SECRET must not use a placeholder value in production",
      });
    }
    if (!data.REDIS_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["REDIS_URL"],
        message: "REDIS_URL is required in production",
      });
    }
    if (data.RATE_LIMIT_BACKEND !== "redis") {
      ctx.addIssue({
        code: "custom",
        path: ["RATE_LIMIT_BACKEND"],
        message: "RATE_LIMIT_BACKEND must be redis in production",
      });
    }
    if (data.RATE_LIMIT_IN_MEMORY_FALLBACK === "true") {
      ctx.addIssue({
        code: "custom",
        path: ["RATE_LIMIT_IN_MEMORY_FALLBACK"],
        message: "RATE_LIMIT_IN_MEMORY_FALLBACK must be false in production",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function resolveEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  // Tests often omit full env; provide safe defaults for non-production.
  const merged: NodeJS.ProcessEnv = {
    ...env,
    DATABASE_URL:
      env.DATABASE_URL ??
      (env.NODE_ENV === "test" || env.VITEST
        ? "postgresql://forum:forum@localhost:5433/forum_test"
        : env.DATABASE_URL),
    AUTH_SECRET:
      env.AUTH_SECRET ??
      (env.NODE_ENV === "test" || env.VITEST
        ? "test-auth-secret-at-least-32-chars-long"
        : env.AUTH_SECRET),
  };

  return envSchema.parse({
    NODE_ENV: merged.NODE_ENV,
    DATABASE_URL: merged.DATABASE_URL,
    AUTH_SECRET: merged.AUTH_SECRET,
    AUTH_URL: merged.AUTH_URL,
    NEXT_PUBLIC_APP_URL: merged.NEXT_PUBLIC_APP_URL,
    APP_URL: merged.APP_URL,
    REDIS_URL: merged.REDIS_URL,
    RATE_LIMIT_BACKEND: merged.RATE_LIMIT_BACKEND,
    RATE_LIMIT_IN_MEMORY_FALLBACK: merged.RATE_LIMIT_IN_MEMORY_FALLBACK,
    E2E: merged.E2E,
    SENTRY_DSN: merged.SENTRY_DSN,
    RUN_INTEGRATION: merged.RUN_INTEGRATION,
  });
}

/** Lazily validated process env. Safe to import from server modules. */
export function getEnv(): AppEnv {
  if (!cached) {
    cached = resolveEnv(process.env);
  }
  return cached;
}

/** Test helper to clear cached env between cases. */
export function resetEnvCacheForTests(): void {
  cached = null;
}
