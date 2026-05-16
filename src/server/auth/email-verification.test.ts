import { describe, expect, it } from "vitest";
import {
  assertEmailVerified,
  verifyEmailToken,
} from "@/server/auth/email-verification";
import {
  replaceAuthToken,
  VERIFICATION_TOKEN_TTL_MS,
} from "@/server/auth/tokens";
import { createInMemoryAuthDb } from "@/server/auth/auth-token-test-utils";

describe("email verification", () => {
  it("verifies a valid token and consumes it", async () => {
    const { database, users } = createInMemoryAuthDb({
      users: [{ id: "user-1", emailVerified: null }],
    });
    const token = await replaceAuthToken(database as never, "verify", "user-1", VERIFICATION_TOKEN_TTL_MS);

    await expect(verifyEmailToken(database as never, token)).resolves.toBe("success");
    expect(users.get("user-1")?.emailVerified).toBeInstanceOf(Date);
    await expect(verifyEmailToken(database as never, token)).resolves.toBe("invalid");
  });

  it("rejects expired and invalid tokens", async () => {
    const { database } = createInMemoryAuthDb({
      users: [{ id: "user-1", emailVerified: null }],
      tokens: [
        {
          identifier: "verify:user-1",
          token: "expired",
          expires: new Date(Date.now() - 1),
        },
      ],
    });

    await expect(verifyEmailToken(database as never, "expired")).resolves.toBe("expired");
    await expect(verifyEmailToken(database as never, "missing")).resolves.toBe("invalid");
  });

  it("returns already-verified for an outstanding token", async () => {
    const { database } = createInMemoryAuthDb({
      users: [{ id: "user-1", emailVerified: new Date() }],
      tokens: [
        {
          identifier: "verify:user-1",
          token: "already",
          expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        },
      ],
    });

    await expect(verifyEmailToken(database as never, "already")).resolves.toBe("already-verified");
  });

  it("blocks unverified users from verified-only actions", async () => {
    const { database } = createInMemoryAuthDb({
      users: [{ id: "user-1", emailVerified: null }],
    });
    await expect(assertEmailVerified(database as never, "user-1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
