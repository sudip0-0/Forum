import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  clearInMemoryRateLimitsForTests,
  hashRateLimitIdentifier,
  rateLimit,
  resetRateLimit,
  RL_CREATE_THREAD,
  RL_LOGIN,
  RL_PASSWORD_RESET,
  RL_REGISTER,
  RL_REPORT,
  RL_RESEND_VERIFICATION,
  RL_SEARCH,
} from "@/server/api/rate-limit";

const originalEnv = { ...process.env };

describe("rate limiting", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      RATE_LIMIT_BACKEND: "memory",
      REDIS_URL: "",
      E2E: "",
    };
    clearInMemoryRateLimitsForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
    clearInMemoryRateLimitsForTests();
  });

  it("allows requests under the limit and returns remaining count", async () => {
    for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
      const result = await rateLimit("user-1", RL_LOGIN);
      expect(result).toMatchObject({
        allowed: true,
        limit: RL_LOGIN.maxRequests,
        remaining: RL_LOGIN.maxRequests - i - 1,
      });
    }
  });

  it("throws TOO_MANY_REQUESTS when limit exceeded", async () => {
    for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
      await checkRateLimit("user-2", RL_LOGIN);
    }
    await expect(checkRateLimit("user-2", RL_LOGIN)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("returns retry-after behavior for blocked windows", async () => {
    for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
      await rateLimit("user-retry", RL_LOGIN);
    }

    vi.advanceTimersByTime(10 * 60 * 1000);
    const result = await rateLimit("user-retry", RL_LOGIN);

    expect(result).toEqual({
      allowed: false,
      limit: RL_LOGIN.maxRequests,
      remaining: 0,
      retryAfterSeconds: 5 * 60,
    });
  });

  it("resets after window expires", async () => {
    for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
      await checkRateLimit("user-3", RL_LOGIN);
    }
    await expect(checkRateLimit("user-3", RL_LOGIN)).rejects.toBeTruthy();

    vi.advanceTimersByTime(RL_LOGIN.windowMs + 1);

    await expect(checkRateLimit("user-3", RL_LOGIN)).resolves.toMatchObject({
      allowed: true,
    });
  });

  it("tracks different keys independently", async () => {
    for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
      await checkRateLimit("user-a", RL_LOGIN);
    }
    await expect(checkRateLimit("user-a", RL_LOGIN)).rejects.toBeTruthy();
    await expect(checkRateLimit("user-b", RL_LOGIN)).resolves.toMatchObject({
      allowed: true,
    });
  });

  it("tracks different configs independently", async () => {
    for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
      await checkRateLimit("user-c", RL_LOGIN);
    }
    await expect(checkRateLimit("user-c", RL_LOGIN)).rejects.toBeTruthy();
    await expect(checkRateLimit("user-c", RL_SEARCH)).resolves.toMatchObject({
      allowed: true,
    });
  });

  it("rate-limits registration, verification resends, password reset requests, and reports", async () => {
    for (let i = 0; i < RL_REGISTER.maxRequests; i++) {
      await checkRateLimit("203.0.113.10", RL_REGISTER);
    }
    await expect(checkRateLimit("203.0.113.10", RL_REGISTER)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });

    for (let i = 0; i < RL_RESEND_VERIFICATION.maxRequests; i++) {
      await checkRateLimit("verify-key", RL_RESEND_VERIFICATION);
    }
    await expect(checkRateLimit("verify-key", RL_RESEND_VERIFICATION)).rejects.toBeTruthy();

    for (let i = 0; i < RL_PASSWORD_RESET.maxRequests; i++) {
      await checkRateLimit("reset-key", RL_PASSWORD_RESET);
    }
    await expect(checkRateLimit("reset-key", RL_PASSWORD_RESET)).rejects.toBeTruthy();

    for (let i = 0; i < RL_REPORT.maxRequests; i++) {
      await checkRateLimit("reporter-1", RL_REPORT);
    }
    await expect(checkRateLimit("reporter-1", RL_REPORT)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("handles partial window expiry correctly", async () => {
    for (let i = 0; i < RL_CREATE_THREAD.maxRequests - 1; i++) {
      await checkRateLimit("user-d", RL_CREATE_THREAD);
    }
    vi.advanceTimersByTime(RL_CREATE_THREAD.windowMs / 2);

    await expect(checkRateLimit("user-d", RL_CREATE_THREAD)).resolves.toBeTruthy();
    await expect(checkRateLimit("user-d", RL_CREATE_THREAD)).rejects.toBeTruthy();
  });

  it("cleans up expired entries", async () => {
    await checkRateLimit("ephemeral", RL_LOGIN);
    vi.advanceTimersByTime(RL_LOGIN.windowMs + 10 * 60 * 1000);
    await checkRateLimit("other", RL_LOGIN);

    await expect(checkRateLimit("ephemeral", RL_LOGIN)).resolves.toBeTruthy();
  });

  it("can reset a key explicitly", async () => {
    for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
      await checkRateLimit("reset-me", RL_LOGIN);
    }
    await resetRateLimit("reset-me", RL_LOGIN);

    await expect(checkRateLimit("reset-me", RL_LOGIN)).resolves.toMatchObject({
      allowed: true,
    });
  });

  it("hashes email identifiers before they are used in rate limit keys", () => {
    const hash = hashRateLimitIdentifier("User@Example.com ");

    expect(hash).toBe(hashRateLimitIdentifier("user@example.com"));
    expect(hash).not.toContain("user@example.com");
    expect(hash).toHaveLength(64);
  });

  it("fails closed for sensitive auth actions when Redis is configured but unavailable", async () => {
    process.env = {
      ...process.env,
      RATE_LIMIT_BACKEND: "redis",
      REDIS_URL: "redis://127.0.0.1:1",
      RATE_LIMIT_IN_MEMORY_FALLBACK: "false",
      NODE_ENV: "production",
    };

    const result = await rateLimit("auth-sensitive", RL_PASSWORD_RESET);

    expect(result).toMatchObject({
      allowed: false,
      limit: RL_PASSWORD_RESET.maxRequests,
      remaining: 0,
    });
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});
