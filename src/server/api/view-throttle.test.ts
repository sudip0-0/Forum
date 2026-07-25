import { beforeEach, describe, expect, it, vi } from "vitest";
import { shouldCountThreadView } from "@/server/api/view-throttle";
import { clearInMemoryRateLimitsForTests } from "@/server/api/rate-limit";

describe("shouldCountThreadView", () => {
  beforeEach(() => {
    clearInMemoryRateLimitsForTests();
    vi.stubEnv("RATE_LIMIT_BACKEND", "memory");
    vi.stubEnv("E2E", "");
  });

  it("allows the first view and throttles the second", async () => {
    await expect(shouldCountThreadView("user-1", "thread-1")).resolves.toBe(true);
    await expect(shouldCountThreadView("user-1", "thread-1")).resolves.toBe(false);
  });

  it("tracks identities independently", async () => {
    await expect(shouldCountThreadView("user-1", "thread-1")).resolves.toBe(true);
    await expect(shouldCountThreadView("user-2", "thread-1")).resolves.toBe(true);
  });
});
