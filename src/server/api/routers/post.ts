import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";
import { checkRateLimit, RL_REPLY, assertNotSuspended } from "@/server/api/rate-limit";

const listByThreadSchema = z.object({
  threadId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

const createSchema = z.object({
  threadId: z.string().min(1),
  parentId: z.string().optional(),
  content: z.string().min(1).max(20000),
});

export const postRouter = router({
  listByThread: publicProcedure
    .input(listByThreadSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        threadId: input.threadId,
        isDeleted: false,
      };

      if (input.cursor) {
        where.id = { gt: input.cursor };
      }

      const posts = await ctx.db.post.findMany({
        where,
        orderBy: { createdAt: "asc" },
        take: input.limit + 1,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              image: true,
              createdAt: true,
              _count: { select: { posts: true } },
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              author: { select: { username: true, displayName: true } },
            },
          },
          reactions: { select: { userId: true, emoji: true } },
        },
      });

      let nextCursor: string | undefined;
      if (posts.length > input.limit) {
        nextCursor = posts.pop()!.id;
      }

      return { posts, nextCursor };
    }),

  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      checkRateLimit(ctx.session.user.id, RL_REPLY);
      assertNotSuspended(ctx.session.user);

      const thread = await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        include: {
          forum: {
            include: {
              category: {
                include: { section: true },
              },
            },
          },
        },
      });

      if (!thread || thread.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found." });
      }

      if (thread.isLocked) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Thread is locked." });
      }
      if (
        !thread.forum.isPublic ||
        !thread.forum.category.isPublic ||
        !thread.forum.category.section.isPublic
      ) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found." });
      }
      if (
        thread.forum.isLocked ||
        thread.forum.category.isLocked ||
        thread.forum.category.section.isLocked
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Posting is locked in this forum." });
      }

      if (input.parentId) {
        const parent = await ctx.db.post.findUnique({
          where: { id: input.parentId },
        });

        if (!parent || parent.threadId !== input.threadId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid parent post." });
        }

      }

      const post = await ctx.db.post.create({
        data: {
          threadId: input.threadId,
          authorId: ctx.session.user.id,
          parentId: input.parentId ?? null,
          content: input.content,
        },
      });

      await ctx.db.thread.update({
        where: { id: input.threadId },
        data: {
          replyCount: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });

      return post;
    }),
});
