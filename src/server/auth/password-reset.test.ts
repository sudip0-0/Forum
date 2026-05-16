import { describe, expect, it } from "vitest";
import { verifyPassword } from "@/server/auth/password";
import {
  inspectPasswordResetToken,
  resetPasswordWithToken,
} from "@/server/auth/password-reset";
import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  replaceAuthToken,
} from "@/server/auth/tokens";
import { createInMemoryAuthDb } from "@/server/auth/auth-token-test-utils";

describe("password reset", () => {
  it("resets a password with a valid single-use token", async () => {
    const { database, users } = createInMemoryAuthDb({
      users: [{ id: "user-1", emailVerified: new Date(), passwordHash: null }],
    });
    const token = await replaceAuthToken(database as never, "reset", "user-1", PASSWORD_RESET_TOKEN_TTL_MS);

    await expect(inspectPasswordResetToken(database as never, token)).resolves.toBe("valid");
    await expect(resetPasswordWithToken(database as never, token, "new-password-123")).resolves.toBe("success");
    await expect(resetPasswordWithToken(database as never, token, "another-password")).resolves.toBe("invalid");
    await expect(verifyPassword("new-password-123", users.get("user-1")!.passwordHash!)).resolves.toBe(true);
    await expect(verifyPassword("old-password", users.get("user-1")!.passwordHash!)).resolves.toBe(false);
  });

  it("rejects expired and invalid reset tokens", async () => {
    const { database } = createInMemoryAuthDb({
      users: [{ id: "user-1", emailVerified: new Date(), passwordHash: null }],
      tokens: [
        {
          identifier: "reset:user-1",
          token: "expired",
          expires: new Date(Date.now() - 1),
        },
      ],
    });

    await expect(inspectPasswordResetToken(database as never, "expired")).resolves.toBe("expired");
    await expect(resetPasswordWithToken(database as never, "missing", "new-password-123")).resolves.toBe("invalid");
  });
});
