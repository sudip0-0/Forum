import type { db as dbType } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { parseTokenIdentifier } from "@/server/auth/tokens";

export type PasswordResetTokenStatus = "valid" | "expired" | "invalid";
export type PasswordResetResult = "success" | "expired" | "invalid";

export async function inspectPasswordResetToken(
  database: typeof dbType,
  token: string,
): Promise<PasswordResetTokenStatus> {
  const resetToken = await database.verificationToken.findUnique({ where: { token } });
  if (!resetToken) return "invalid";

  const parsedIdentifier = parseTokenIdentifier(resetToken.identifier);
  if (!parsedIdentifier || parsedIdentifier.purpose !== "reset") return "invalid";

  if (resetToken.expires <= new Date()) {
    await database.verificationToken.delete({ where: { token } });
    return "expired";
  }

  return "valid";
}

export async function resetPasswordWithToken(
  database: typeof dbType,
  token: string,
  password: string,
): Promise<PasswordResetResult> {
  const resetToken = await database.verificationToken.findUnique({ where: { token } });
  if (!resetToken) return "invalid";

  const parsedIdentifier = parseTokenIdentifier(resetToken.identifier);
  if (!parsedIdentifier || parsedIdentifier.purpose !== "reset") return "invalid";

  if (resetToken.expires <= new Date()) {
    await database.verificationToken.delete({ where: { token } });
    return "expired";
  }

  const user = await database.user.findUnique({
    where: { id: parsedIdentifier.userId },
    select: { id: true },
  });
  if (!user) {
    await database.verificationToken.delete({ where: { token } });
    return "invalid";
  }

  const passwordHash = await hashPassword(password);
  await database.$transaction([
    database.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    database.verificationToken.delete({ where: { token } }),
  ]);

  return "success";
}
