import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, RL_LOGIN, RL_SEARCH, RL_CREATE_THREAD } from "@/server/api/rate-limit";

describe("rate limiting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("allows requests under the limit", () => {
      for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
        expect(() => checkRateLimit("user-1", RL_LOGIN)).not.toThrow();
      }
    });

    it("throws TOO_MANY_REQUESTS when limit exceeded", () => {
      for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
        checkRateLimit("user-2", RL_LOGIN);
      }
      expect(() => checkRateLimit("user-2", RL_LOGIN)).toThrow(
        expect.objectContaining({ code: "TOO_MANY_REQUESTS" }),
      );
    });

    it("resets after window expires", () => {
      for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
        checkRateLimit("user-3", RL_LOGIN);
      }
      expect(() => checkRateLimit("user-3", RL_LOGIN)).toThrow();

      vi.advanceTimersByTime(RL_LOGIN.windowMs + 1);

      expect(() => checkRateLimit("user-3", RL_LOGIN)).not.toThrow();
    });

    it("tracks different keys independently", () => {
      for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
        checkRateLimit("user-a", RL_LOGIN);
      }
      expect(() => checkRateLimit("user-a", RL_LOGIN)).toThrow();
      expect(() => checkRateLimit("user-b", RL_LOGIN)).not.toThrow();
    });

    it("tracks different configs independently", () => {
      for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
        checkRateLimit("user-c", RL_LOGIN);
      }
      expect(() => checkRateLimit("user-c", RL_LOGIN)).toThrow();
      expect(() => checkRateLimit("user-c", RL_SEARCH)).not.toThrow();
    });

    it("handles partial window expiry correctly", () => {
      for (let i = 0; i < RL_CREATE_THREAD.maxRequests - 1; i++) {
        checkRateLimit("user-d", RL_CREATE_THREAD);
      }
      vi.advanceTimersByTime(RL_CREATE_THREAD.windowMs / 2);
      // still not reset, should allow the last one then reject
      expect(() => checkRateLimit("user-d", RL_CREATE_THREAD)).not.toThrow();
      expect(() => checkRateLimit("user-d", RL_CREATE_THREAD)).toThrow();
    });

    it("cleans up expired entries", () => {
      checkRateLimit("ephemeral", RL_LOGIN);
      vi.advanceTimersByTime(RL_LOGIN.windowMs + 10 * 60 * 1000);
      checkRateLimit("other", RL_LOGIN);
      // the cleanup should have removed the expired "ephemeral" entry
      expect(() => checkRateLimit("ephemeral", RL_LOGIN)).not.toThrow();
    });
  });
});
