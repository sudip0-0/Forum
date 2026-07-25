import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function trackEvent(
  db: Db,
  input: {
    name: string;
    userId?: string | null;
    path?: string | null;
    meta?: Prisma.InputJsonValue;
  },
) {
  try {
    await db.analyticsEvent.create({
      data: {
        name: input.name,
        userId: input.userId ?? null,
        path: input.path ?? null,
        meta: input.meta ?? undefined,
      },
    });
  } catch {
    // Analytics must never break product flows.
  }
}
