import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  registerUser,
  requestPasswordResetAction,
  resendVerificationEmailAction,
} from "@/server/auth/actions";
import {
  clearInMemoryRateLimitsForTests,
  hashRateLimitIdentifier,
  resetRateLimit,
  RL_PASSWORD_RESET,
  RL_RESEND_VERIFICATION,
} from "@/server/api/rate-limit";
import { db } from "@/server/db/prisma";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/server/email";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/server/db/prisma", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn().mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  },
}));

vi.mock("@/server/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/email/config", () => ({
  resolveEmailConfig: vi.fn().mockReturnValue({
    APP_URL: "http://localhost:3000",
  }),
}));

function formDataOf(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearInMemoryRateLimitsForTests();
  });

  it("creates a verification token and requests email after registration", async () => {
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockResolvedValue({
      id: "user-1",
      email: "new@example.com",
    } as never);

    await expect(
      registerUser(
        null,
        formDataOf({
          username: "newuser",
          email: "new@example.com",
          password: "Password123",
        }),
      ),
    ).resolves.toEqual({ success: true });

    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "verify:user-1" },
    });
    expect(db.verificationToken.create).toHaveBeenCalled();
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new@example.com",
        verificationUrl: expect.stringContaining("/verify-email?token="),
      }),
    );
  });

  it("returns success without creating when email already exists", async () => {
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce({ id: "existing" } as never)
      .mockResolvedValueOnce(null);

    await expect(
      registerUser(
        null,
        formDataOf({
          username: "newuser",
          email: "taken@example.com",
          password: "Password123",
        }),
      ),
    ).resolves.toEqual({ success: true });

    expect(db.user.create).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("resend replaces the existing verification token", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "member@example.com",
      emailVerified: null,
    } as never);

    await expect(
      resendVerificationEmailAction(
        null,
        formDataOf({ email: "member@example.com" }),
      ),
    ).resolves.toEqual({ success: true });

    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "verify:user-1" },
    });
    expect(sendVerificationEmail).toHaveBeenCalled();
  });

  it("returns a generic password reset response for existing and missing accounts", async () => {
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce({
        id: "user-1",
        email: "member@example.com",
        passwordHash: "hash",
      } as never)
      .mockResolvedValueOnce(null);

    await expect(
      requestPasswordResetAction(null, formDataOf({ email: "member@example.com" })),
    ).resolves.toEqual({ success: true });
    await expect(
      requestPasswordResetAction(null, formDataOf({ email: "missing@example.com" })),
    ).resolves.toEqual({ success: true });

    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("throttles password reset requests", async () => {
    const email = "reset-throttle@example.com";
    await resetRateLimit(hashRateLimitIdentifier(email), RL_PASSWORD_RESET);
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    for (let i = 0; i < RL_PASSWORD_RESET.maxRequests; i++) {
      await requestPasswordResetAction(null, formDataOf({ email }));
    }

    await expect(
      requestPasswordResetAction(null, formDataOf({ email })),
    ).resolves.toMatchObject({
      success: false,
      throttled: true,
      retryAfterSeconds: expect.any(Number),
    });
  });

  it("throttles verification resend requests", async () => {
    const email = "throttle@example.com";
    await resetRateLimit(hashRateLimitIdentifier(email), RL_RESEND_VERIFICATION);
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    for (let i = 0; i < RL_RESEND_VERIFICATION.maxRequests; i++) {
      await resendVerificationEmailAction(null, formDataOf({ email }));
    }

    await expect(
      resendVerificationEmailAction(null, formDataOf({ email })),
    ).resolves.toMatchObject({
      success: false,
      throttled: true,
      retryAfterSeconds: expect.any(Number),
    });
  });

  it("does not leak account existence when a password reset request is throttled", async () => {
    const email = "existing-throttled@example.com";
    await resetRateLimit(hashRateLimitIdentifier(email), RL_PASSWORD_RESET);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "user-1",
      email,
      passwordHash: "hash",
    } as never);

    for (let i = 0; i < RL_PASSWORD_RESET.maxRequests; i++) {
      await requestPasswordResetAction(null, formDataOf({ email }));
    }

    const result = await requestPasswordResetAction(null, formDataOf({ email }));

    expect(result).toMatchObject({
      success: false,
      throttled: true,
    });
    expect(result.error).toBe("Too many password reset requests. Please try again later.");
    expect(result.error).not.toContain("account");
  });
});
