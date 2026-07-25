import { afterEach, describe, expect, it } from "vitest";
import { resetEnvCacheForTests, resolveEnv } from "@/server/env";

afterEach(() => {
  resetEnvCacheForTests();
});

describe("resolveEnv", () => {
  it("accepts development config with placeholder secret", () => {
    const env = resolveEnv({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://forum:forum@localhost:5433/forum_dev",
      AUTH_SECRET: "replace-with-local-secret",
      RATE_LIMIT_BACKEND: "memory",
    });
    expect(env.DATABASE_URL).toContain("forum_dev");
  });

  it("rejects production placeholder AUTH_SECRET", () => {
    expect(() =>
      resolveEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://forum:forum@localhost:5433/forum_dev",
        AUTH_SECRET: "replace-with-local-secret",
        REDIS_URL: "redis://localhost:6379",
        RATE_LIMIT_BACKEND: "redis",
        RATE_LIMIT_IN_MEMORY_FALLBACK: "false",
      }),
    ).toThrow(/placeholder/i);
  });

  it("requires redis backend in production", () => {
    expect(() =>
      resolveEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://forum:forum@localhost:5433/forum_dev",
        AUTH_SECRET: "a-production-secret-at-least-32-chars",
        REDIS_URL: "redis://localhost:6379",
        RATE_LIMIT_BACKEND: "memory",
        RATE_LIMIT_IN_MEMORY_FALLBACK: "false",
      }),
    ).toThrow(/RATE_LIMIT_BACKEND/);
  });

  it("accepts valid production config", () => {
    const env = resolveEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://forum:forum@localhost:5433/forum_dev",
      AUTH_SECRET: "a-production-secret-at-least-32-chars",
      REDIS_URL: "redis://localhost:6379",
      RATE_LIMIT_BACKEND: "redis",
      RATE_LIMIT_IN_MEMORY_FALLBACK: "false",
    });
    expect(env.RATE_LIMIT_BACKEND).toBe("redis");
  });

  it("skips strict production rules during next build phase", () => {
    const prev = process.env.NEXT_PHASE;
    process.env.NEXT_PHASE = "phase-production-build";
    try {
      const env = resolveEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://forum:forum@localhost:5433/forum_dev",
        AUTH_SECRET: "replace-with-local-secret",
        RATE_LIMIT_BACKEND: "memory",
      });
      expect(env.RATE_LIMIT_BACKEND).toBe("memory");
    } finally {
      if (prev === undefined) {
        delete process.env.NEXT_PHASE;
      } else {
        process.env.NEXT_PHASE = prev;
      }
    }
  });
});
