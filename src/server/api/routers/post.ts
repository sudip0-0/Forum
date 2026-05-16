import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";
import { checkRateLimit, RL_REPLY, assertNotSuspended } from "@/server/api/rate-limit";
import { assertEmailVerified } from "@/server/auth/email-verification";

const listByThreadSchema = z.object({
  threadId: z.string().min(1),
  sort: z.enum(["oldest", "newest", "reactions"]).default("oldest"),
  repliesOnly: z.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

const createSchema = z.object({
  threadId: z.string().min(1),
  parentId: z.string().optional(),
  content: z.string().min(1).max(20000),
});
const updateOwnSchema = z.object({
  postId: z.string().min(1),
  content: createSchema.shape.content,
});
const deleteOwnSchema = z.object({ postId: z.string().min(1) });

function isVisibleThread(thread: {
  isDeleted: boolean;
  forum: { isPublic: boolean; category: { isPublic: boolean; section: { isPublic: boolean } } };
}) {
  return (
    !thread.isDeleted &&
    thread.forum.isPublic &&
    thread.forum.category.isPublic &&
    thread.forum.category.section.isPublic
  );
}

export const postRouter = router({
  listByThread: publicProcedure
    .input(listByThreadSchema)
    .query(async ({ ctx, input }) => {
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

      if (!thread || !isVisibleThread(thread)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found." });
      }

      const where: Record<string, unknown> = {
        threadId: input.threadId,
        isDeleted: false,
        ...(input.repliesOnly ? { parentId: { not: null } } : {}),
      };

      if (input.cursor) {
        where.id = { gt: input.cursor };
      }

      const posts = await ctx.db.post.findMany({
        where,
        orderBy:
          input.sort === "newest"
            ? [{ createdAt: "desc" }, { id: "desc" }]
            : input.sort === "reactions"
              ? [{ reactions: { _count: "desc" } }, { createdAt: "asc" }, { id: "asc" }]
              : [{ createdAt: "asc" }, { id: "asc" }],
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
              isDeleted: true,
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
      await checkRateLimit(ctx.session.user.id, RL_REPLY);
      assertNotSuspended(ctx.session.user);
      await assertEmailVerified(ctx.db, ctx.session.user.id);

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

        // Enforce a maximum nesting depth of 3 levels by walking the parent chain.
        // depth 1 = direct reply to a root post; depth 3 = maximum allowed.
        let depth = 1;
        let current: { parentId: string | null } = parent;
        while (current.parentId) {
          depth++;
          if (depth >= 3) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Maximum reply depth of 3 levels reached.",
            });
          }
          const grandparent = await ctx.db.post.findUnique({
            where: { id: current.parentId },
            select: { parentId: true },
          });
          if (!grandparent) break;
          current = grandparent;
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

  updateOwn: protectedProcedure
    .input(updateOwnSchema)
    .mutation(async ({ ctx, input }) => {
      assertNotSuspended(ctx.session.user);

      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        include: {
          thread: {
            include: {
              forum: { include: { category: { include: { section: true } } } },
            },
          },
        },
      });
      if (!post || post.isDeleted || !isVisibleThread(post.thread)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });
      }
      if (post.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own replies." });
      }

      const originalPost = await ctx.db.post.findFirst({
        where: { threadId: post.threadId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      if (originalPost?.id === post.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Original thread content must be edited with the thread.",
        });
      }

      await ctx.db.post.update({
        where: { id: post.id },
        data: { content: input.content },
      });
      return { success: true };
    }),

  deleteOwn: protectedProcedure
    .input(deleteOwnSchema)
    .mutation(async ({ ctx, input }) => {
      assertNotSuspended(ctx.session.user);

      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        include: {
          thread: {
            include: {
              forum: { include: { category: { include: { section: true } } } },
            },
          },
        },
      });
      if (!post || post.isDeleted || !isVisibleThread(post.thread)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });
      }
      if (post.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own replies." });
      }

      const originalPost = await ctx.db.post.findFirst({
        where: { threadId: post.threadId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      if (originalPost?.id === post.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Original thread content must be deleted with the thread.",
        });
      }

      await ctx.db.$transaction([
        ctx.db.post.update({
          where: { id: post.id },
          data: { isDeleted: true },
        }),
        ctx.db.thread.update({
          where: { id: post.threadId },
          data: { replyCount: { decrement: 1 } },
        }),
      ]);

      return { success: true };
    }),
});
