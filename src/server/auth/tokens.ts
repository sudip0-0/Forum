import { randomBytes } from "node:crypto";
import type { db as dbType } from "@/server/db/prisma";

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export type AuthTokenPurpose = "verify" | "reset";

export function buildTokenIdentifier(purpose: AuthTokenPurpose, userId: string): string {
  return `${purpose}:${userId}`;
}

export function parseTokenIdentifier(identifier: string): {
  purpose: AuthTokenPurpose;
  userId: string;
} | null {
  const [purpose, ...rest] = identifier.split(":");
  const userId = rest.join(":");
  if ((purpose !== "verify" && purpose !== "reset") || !userId) return null;
  return { purpose, userId };
}

export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

export async function replaceAuthToken(
  database: typeof dbType,
  purpose: AuthTokenPurpose,
  userId: string,
  ttlMs: number,
): Promise<string> {
  const identifier = buildTokenIdentifier(purpose, userId);
  const token = generateSecureToken();

  await database.$transaction([
    database.verificationToken.deleteMany({ where: { identifier } }),
    database.verificationToken.create({
      data: {
        identifier,
        token,
        expires: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return token;
}
