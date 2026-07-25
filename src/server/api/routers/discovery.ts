import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { publicProcedure, router } from "@/server/api/trpc";
import { VISIBLE_PUBLIC_THREAD } from "@/server/db/visibility";

export const discoveryRouter = router({
  home: publicProcedure.query(async ({ ctx }) => {
    const publicThreadWhere: Prisma.ThreadWhereInput = VISIBLE_PUBLIC_THREAD;

    const [latestMessages, activeThreads, popularThreads, popularTags, stats] = await Promise.all([
      ctx.db.post.findMany({
        where: {
          isDeleted: false,
          thread: VISIBLE_PUBLIC_THREAD,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          author: { select: { username: true, displayName: true } },
          thread: { select: { title: true, slug: true, forum: { select: { slug: true, name: true } } } },
        },
      }),
      ctx.db.thread.findMany({
        where: publicThreadWhere,
        orderBy: { lastActivityAt: "desc" },
        take: 8,
        include: { forum: { select: { slug: true, name: true } }, tags: true },
      }),
      ctx.db.thread.findMany({
        where: publicThreadWhere,
        orderBy: [{ viewCount: "desc" }, { replyCount: "desc" }],
        take: 5,
        include: { forum: { select: { slug: true, name: true } } },
      }),
      ctx.db.tag.findMany({
        where: { threads: { some: publicThreadWhere } },
        include: { _count: { select: { threads: { where: publicThreadWhere } } } },
      }),
      Promise.all([
        ctx.db.user.count(),
        ctx.db.thread.count({ where: publicThreadWhere }),
        ctx.db.post.count({
          where: {
            isDeleted: false,
            thread: publicThreadWhere,
          },
        }),
      ]),
    ]);

    return {
      latestMessages,
      activeThreads,
      popularThreads,
      popularTags: popularTags
        .sort((left, right) => right._count.threads - left._count.threads)
        .slice(0, 10),
      stats: { users: stats[0], threads: stats[1], messages: stats[2] },
    };
  }),

  listThreadsByTag: publicProcedure
    .input(z.object({
      tagSlug: z.string().min(1),
      sort: z.enum(["latest", "newest", "oldest", "views", "replies", "reactions"]).default("latest"),
      direction: z.enum(["asc", "desc"]).default("desc"),
      cursor: z.string().min(1).optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const tag = await ctx.db.tag.findUnique({ where: { slug: input.tagSlug } });
      if (!tag) throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found." });

      const where: Prisma.ThreadWhereInput = {
        tags: { some: { slug: input.tagSlug } },
        ...VISIBLE_PUBLIC_THREAD,
      };

      const orderBy: Prisma.ThreadOrderByWithRelationInput[] =
        input.sort === "newest"
          ? [{ createdAt: input.direction }]
          : input.sort === "oldest"
            ? [{ createdAt: input.direction === "desc" ? "asc" : "desc" }]
            : input.sort === "views"
              ? [{ viewCount: input.direction }]
              : input.sort === "replies"
                ? [{ replyCount: input.direction }]
                : input.sort === "reactions"
                  ? [{ reactions: { _count: input.direction } }]
                  : [{ lastActivityAt: input.direction }];

      const threads = await ctx.db.thread.findMany({
        where,
        orderBy: [...orderBy, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          forum: { select: { slug: true, name: true } },
          tags: true,
          _count: { select: { reactions: true } },
        },
      });

      let nextCursor: string | null = null;
      if (threads.length > input.limit) nextCursor = threads.pop()!.id;

      return { threads, nextCursor, tag };
    }),
});
