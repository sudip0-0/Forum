import { beforeEach, describe, expect, it, vi } from "vitest";
import { authConfig, JWT_REFRESH_INTERVAL_MS } from "@/server/auth/config";
import {
  clearInMemoryRateLimitsForTests,
  hashRateLimitIdentifier,
  resetRateLimit,
  RL_LOGIN,
} from "@/server/api/rate-limit";
import { db } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";

vi.mock("next-auth", () => ({
  default: vi.fn().mockReturnValue({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/server/db/prisma", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/password", () => ({
  verifyPassword: vi.fn(),
}));

async function authorize(credentials: { email: string; password: string }) {
  const provider = authConfig.providers[0] as unknown as {
    options: {
      authorize: (credentials: unknown, request: Request) => Promise<unknown>;
    };
  };
  return provider.options.authorize(
    credentials,
    new Request("http://localhost/api/auth/callback/credentials"),
  );
}

describe("auth config", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    clearInMemoryRateLimitsForTests();
    await resetRateLimit(hashRateLimitIdentifier("member@example.com"), RL_LOGIN);
  });

  it("blocks repeated login attempts", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    for (let i = 0; i < RL_LOGIN.maxRequests; i++) {
      await expect(
        authorize({ email: "member@example.com", password: "wrong-password" }),
      ).resolves.toBeNull();
    }

    await expect(
      authorize({ email: "member@example.com", password: "wrong-password" }),
    ).resolves.toBeNull();
    expect(db.user.findUnique).toHaveBeenCalledTimes(RL_LOGIN.maxRequests);
  });

  it("resets the login limiter after a successful login", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "member-1",
      email: "member@example.com",
      username: "member",
      displayName: null,
      passwordHash: "hash",
      role: "MEMBER",
      isSuspended: false,
      tokenVersion: 0,
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    for (let i = 0; i < RL_LOGIN.maxRequests - 1; i++) {
      await authorize({ email: "member@example.com", password: "wrong-password" });
    }
    await expect(
      authorize({ email: "member@example.com", password: "correct-password" }),
    ).resolves.toMatchObject({
      id: "member-1",
      email: "member@example.com",
    });

    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    await expect(
      authorize({ email: "member@example.com", password: "wrong-password" }),
    ).resolves.toBeNull();
  });

  it("refreshes role and suspension from the database after the refresh interval", async () => {
    const jwt = authConfig.callbacks.jwt as (args: {
      token: Record<string, unknown>;
      user?: unknown;
    }) => Promise<Record<string, unknown>>;

    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "MODERATOR",
      isSuspended: true,
      username: "member",
      tokenVersion: 0,
    } as never);

    const refreshed = await jwt({
      token: {
        id: "member-1",
        role: "MEMBER",
        isSuspended: false,
        username: "member",
        tokenVersion: 0,
        lastRefreshedAt: Date.now() - JWT_REFRESH_INTERVAL_MS - 1,
      },
    });

    expect(refreshed.role).toBe("MODERATOR");
    expect(refreshed.isSuspended).toBe(true);
  });

  it("invalidates the JWT when tokenVersion no longer matches", async () => {
    const jwt = authConfig.callbacks.jwt as (args: {
      token: Record<string, unknown>;
      user?: unknown;
    }) => Promise<Record<string, unknown>>;

    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "MEMBER",
      isSuspended: false,
      username: "member",
      tokenVersion: 2,
    } as never);

    const invalidated = await jwt({
      token: {
        id: "member-1",
        role: "MEMBER",
        isSuspended: false,
        username: "member",
        tokenVersion: 0,
        lastRefreshedAt: Date.now() - JWT_REFRESH_INTERVAL_MS - 1,
      },
    });

    expect(invalidated).toEqual({});
  });
});
