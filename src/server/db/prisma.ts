import { PrismaClient } from "@prisma/client";
import { getEnv } from "@/server/env";

// Validate required env early on server boot.
getEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
