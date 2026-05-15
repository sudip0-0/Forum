import { publicProcedure, router } from "@/server/api/trpc";

export const discoveryRouter = router({
  home: publicProcedure.query(async ({ ctx }) => {
    const [latestMessages, activeThreads, popularThreads, popularTags, stats] = await Promise.all([
      ctx.db.post.findMany({
        where: {
          isDeleted: false,
          thread: { isDeleted: false, forum: { isPublic: true, category: { isPublic: true, section: { isPublic: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          author: { select: { username: true, displayName: true } },
          thread: { select: { title: true, slug: true, forum: { select: { slug: true, name: true } } } },
        },
      }),
      ctx.db.thread.findMany({
        where: { isDeleted: false, forum: { isPublic: true, category: { isPublic: true, section: { isPublic: true } } } },
        orderBy: { lastActivityAt: "desc" },
        take: 8,
        include: { forum: { select: { slug: true, name: true } }, tags: true },
      }),
      ctx.db.thread.findMany({
        where: { isDeleted: false, forum: { isPublic: true, category: { isPublic: true, section: { isPublic: true } } } },
        orderBy: [{ viewCount: "desc" }, { replyCount: "desc" }],
        take: 5,
        include: { forum: { select: { slug: true, name: true } } },
      }),
      ctx.db.tag.findMany({
        orderBy: { threads: { _count: "desc" } },
        take: 10,
        include: { _count: { select: { threads: true } } },
      }),
      Promise.all([
        ctx.db.user.count(),
        ctx.db.thread.count({ where: { isDeleted: false } }),
        ctx.db.post.count({ where: { isDeleted: false } }),
      ]),
    ]);

    return {
      latestMessages,
      activeThreads,
      popularThreads,
      popularTags,
      stats: { users: stats[0], threads: stats[1], messages: stats[2] },
    };
  }),
});
