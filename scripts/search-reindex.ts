import { PrismaClient } from "@prisma/client";
import { upsertSearchDocument } from "../src/server/search/meili";

const db = new PrismaClient();

async function main() {
  const threads = await db.thread.findMany({
    where: { isDeleted: false },
    include: {
      posts: {
        where: { isDeleted: false },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      forum: { select: { slug: true } },
      author: { select: { username: true } },
    },
  });
  for (const thread of threads) {
    await upsertSearchDocument({
      id: `thread-${thread.id}`,
      threadId: thread.id,
      title: thread.title,
      content: thread.posts[0]?.content ?? "",
      forumSlug: thread.forum.slug,
      authorUsername: thread.author.username,
      createdAt: thread.createdAt.getTime(),
    });
  }
  console.log(`Reindexed ${threads.length} threads`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
