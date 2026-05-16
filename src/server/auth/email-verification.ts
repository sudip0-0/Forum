import { TRPCError } from "@trpc/server";
import type { db as dbType } from "@/server/db/prisma";
import { parseTokenIdentifier } from "@/server/auth/tokens";

export type EmailVerificationResult = "success" | "expired" | "invalid" | "already-verified";

export async function verifyEmailToken(
  database: typeof dbType,
  token: string,
): Promise<EmailVerificationResult> {
  const verificationToken = await database.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) return "invalid";

  const parsedIdentifier = parseTokenIdentifier(verificationToken.identifier);
  if (!parsedIdentifier || parsedIdentifier.purpose !== "verify") return "invalid";

  if (verificationToken.expires <= new Date()) {
    await database.verificationToken.delete({ where: { token } });
    return "expired";
  }

  const user = await database.user.findUnique({
    where: { id: parsedIdentifier.userId },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    await database.verificationToken.delete({ where: { token } });
    return "invalid";
  }

  if (user.emailVerified) {
    await database.verificationToken.delete({ where: { token } });
    return "already-verified";
  }

  await database.$transaction([
    database.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    database.verificationToken.delete({ where: { token } }),
  ]);

  return "success";
}

export async function assertEmailVerified(
  database: typeof dbType,
  userId: string,
): Promise<void> {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your session has expired. Please sign in again.",
    });
  }

  if (!user.emailVerified) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Verify your email before posting or reporting content.",
    });
  }
}
