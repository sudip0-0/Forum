import { beforeEach, describe, expect, it, vi } from "vitest";
import { authConfig } from "@/server/auth/config";
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
});
