import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

async function ensureBadge(db: Db, slug: string) {
  return db.badge.upsert({
    where: { slug },
    create: {
      slug,
      name:
        slug === "first-post"
          ? "First Post"
          : slug === "solution-author"
            ? "Solution Author"
            : "Rising Voice",
      description: slug,
      threshold: slug === "reputation-10" ? 10 : null,
    },
    update: {},
  });
}

export async function awardBadge(db: Db, userId: string, slug: string) {
  const badge = await ensureBadge(db, slug);
  await db.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    create: { userId, badgeId: badge.id },
    update: {},
  });
}

export async function adjustReputation(db: Db, userId: string, delta: number) {
  const user = await db.user.update({
    where: { id: userId },
    data: { reputation: { increment: delta } },
    select: { reputation: true },
  });
  if (user.reputation >= 10) {
    await awardBadge(db, userId, "reputation-10");
  }
  return user.reputation;
}

export async function maybeAwardFirstPost(db: Db, userId: string) {
  const count = await db.post.count({ where: { authorId: userId, isDeleted: false } });
  if (count === 1) {
    await awardBadge(db, userId, "first-post");
  }
}
