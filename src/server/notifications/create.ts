import type { PrismaClient, Prisma } from "@prisma/client";

export function parseMentions(content: string): string[] {
  const matches = content.matchAll(/@([a-zA-Z0-9_]{2,32})/g);
  return [...new Set([...matches].map((m) => m[1]!.toLowerCase()))];
}

type Db = PrismaClient | Prisma.TransactionClient;

export async function createNotification(
  db: Db,
  input: {
    userId: string;
    type: string;
    actorId?: string | null;
    threadId?: string | null;
    postId?: string | null;
    payload?: Prisma.InputJsonValue;
  },
) {
  if (input.actorId && input.actorId === input.userId) return null;
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      actorId: input.actorId ?? null,
      threadId: input.threadId ?? null,
      postId: input.postId ?? null,
      payload: input.payload ?? undefined,
    },
  });
}

export async function ensureThreadSubscription(
  db: Db,
  userId: string,
  threadId: string,
) {
  if (!("threadSubscription" in db) || !db.threadSubscription?.upsert) {
    return;
  }
  await db.threadSubscription.upsert({
    where: { userId_threadId: { userId, threadId } },
    create: { userId, threadId },
    update: {},
  });
}

export async function notifyThreadSubscribers(
  db: Db,
  input: {
    threadId: string;
    actorId: string;
    postId: string;
    type?: string;
  },
) {
  const subs = await db.threadSubscription.findMany({
    where: { threadId: input.threadId, userId: { not: input.actorId } },
    select: { userId: true },
  });
  if (subs.length === 0) return;
  await db.notification.createMany({
    data: subs.map((s) => ({
      userId: s.userId,
      type: input.type ?? "thread_reply",
      actorId: input.actorId,
      threadId: input.threadId,
      postId: input.postId,
    })),
  });
}

export async function notifyMentions(
  db: Db,
  input: {
    content: string;
    actorId: string;
    threadId: string;
    postId: string;
  },
) {
  const usernames = parseMentions(input.content);
  if (usernames.length === 0) return;
  const users = await db.user.findMany({
    where: { username: { in: usernames, mode: "insensitive" } },
    select: { id: true },
  });
  for (const user of users) {
    await createNotification(db, {
      userId: user.id,
      type: "mention",
      actorId: input.actorId,
      threadId: input.threadId,
      postId: input.postId,
    });
  }
}
