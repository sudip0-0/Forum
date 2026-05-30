import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";
import { checkRateLimit, RL_CREATE_THREAD, assertNotSuspended } from "@/server/api/rate-limit";
import { slugify } from "@/lib/slug";
import { assertEmailVerified } from "@/server/auth/email-verification";
import { isPublicThreadVisible } from "@/server/db/visibility";

const sortSchema = z.enum(["latest", "newest", "oldest", "views", "reactions", "reacted", "replies", "title", "unanswered"]);
const directionSchema = z.enum(["asc", "desc"]).default("desc");
const cursorSchema = z.string().min(1).optional();
const publicListLimitSchema = z.number().int().min(1).max(50).default(20);
const threadContentSchema = z.object({
  title: z.string().min(5).max(150),
  content: z.string().min(10).max(20000),
});

export const threadRouter = router({
  listByCategory: publicProcedure
    .input(z.object({
      categorySlug: z.string().min(1),
      sort: z.enum(["latest", "newest", "unanswered"]).default("latest"),
      cursor: cursorSchema,
      limit: publicListLimitSchema,
    }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { slug: input.categorySlug },
        include: { section: true },
      });
      if (!category || !category.isPublic || !category.section.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." });
      }
      const forums = await ctx.db.forum.findMany({ where: { categoryId: category.id, isPublic: true }, select: { id: true } });
      const where: Prisma.ThreadWhereInput = { forumId: { in: forums.map((forum) => forum.id) }, isDeleted: false };
      if (input.sort === "unanswered") where.replyCount = 0;
      const threads = await ctx.db.thread.findMany({
        where,
        orderBy: input.sort === "newest" ? [{ createdAt: "desc" }, { id: "desc" }] : [{ lastActivityAt: "desc" }, { id: "desc" }],
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
      return { threads, nextCursor, category };
    }),

  listByForum: publicProcedure
    .input(z.object({
      forumSlug: z.string().min(1),
      sort: sortSchema.default("latest"),
      direction: directionSchema,
      pinnedOnly: z.boolean().optional(),
      tagSlug: z.string().min(1).optional(),
      authorUsername: z.string().min(1).optional(),
      updatedWithinDays: z.number().int().min(1).optional(),
      unanswered: z.boolean().optional(),
      cursor: cursorSchema,
      limit: publicListLimitSchema,
    }))
    .query(async ({ ctx, input }) => {
      const forum = await ctx.db.forum.findUnique({
        where: { slug: input.forumSlug },
        include: { category: { include: { section: true } } },
      });
      if (!forum || !forum.isPublic || !forum.category.isPublic || !forum.category.section.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Forum not found." });
      }

      const where: Prisma.ThreadWhereInput = {
        forumId: forum.id,
        isDeleted: false,
        ...(input.pinnedOnly ? { isPinned: true } : {}),
        ...(input.tagSlug ? { tags: { some: { slug: input.tagSlug } } } : {}),
        ...(input.authorUsername ? { author: { username: input.authorUsername } } : {}),
        ...(input.updatedWithinDays ? { lastActivityAt: { gte: new Date(Date.now() - input.updatedWithinDays * 86400000) } } : {}),
        ...(input.unanswered || input.sort === "unanswered" ? { replyCount: 0 } : {}),
      };
      const requestedOrderBy: Prisma.ThreadOrderByWithRelationInput[] =
        input.sort === "newest"
          ? [{ createdAt: input.direction }]
          : input.sort === "oldest"
            ? [{ createdAt: input.direction === "desc" ? "asc" : "desc" }]
            : input.sort === "views"
              ? [{ viewCount: input.direction }]
              : input.sort === "replies"
                ? [{ replyCount: input.direction }]
                : input.sort === "reacted" || input.sort === "reactions"
                  ? [{ reactions: { _count: input.direction } }]
                  : input.sort === "title"
                    ? [{ title: input.direction }]
                    : [{ lastActivityAt: input.direction }];

      const threads = await ctx.db.thread.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, ...requestedOrderBy, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          tags: true,
          _count: { select: { reactions: true } },
        },
      });
      let nextCursor: string | null = null;
      if (threads.length > input.limit) nextCursor = threads.pop()!.id;
      return { threads, nextCursor, forum };
    }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ ctx, input }) => {
    const thread = await ctx.db.thread.findUnique({
      where: { slug: input.slug },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        forum: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPublic: true,
            category: { select: { name: true, slug: true, isPublic: true, section: { select: { name: true, isPublic: true } } } },
          },
        },
        tags: true,
        reactions: { select: { userId: true, emoji: true } },
        _count: { select: { reactions: true } },
      },
    });
    if (!thread || thread.isDeleted || !thread.forum.isPublic || !thread.forum.category.isPublic || !thread.forum.category.section.isPublic) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found." });
    }
    return thread;
  }),

  incrementView: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const thread = await ctx.db.thread.findUnique({
      where: { id: input.id },
      select: {
        isDeleted: true,
        forum: { select: { isPublic: true, category: { select: { isPublic: true, section: { select: { isPublic: true } } } } } },
      },
    });
    if (!thread || !isPublicThreadVisible(thread)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found." });
    }
    await ctx.db.thread.update({ where: { id: input.id }, data: { viewCount: { increment: 1 } } });
    return { success: true };
  }),

  create: protectedProcedure
    .input(z.object({
      forumId: z.string().min(1).optional(),
      categoryId: z.string().min(1).optional(),
      ...threadContentSchema.shape,
      tags: z.array(z.string().min(1).max(40)).max(5).default([]),
    }).refine((value) => !!value.forumId || !!value.categoryId, { message: "Forum is required." }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id, RL_CREATE_THREAD);
      assertNotSuspended(ctx.session.user);
      await assertEmailVerified(ctx.db, ctx.session.user.id);
      const forum =
        input.forumId
          ? await ctx.db.forum.findUnique({
              where: { id: input.forumId },
              include: { category: { include: { section: true } } },
            })
          : await ctx.db.forum.findFirst({
              where: { categoryId: input.categoryId!, isPublic: true },
              include: { category: { include: { section: true } } },
            });
      if (!forum) throw new TRPCError({ code: "NOT_FOUND", message: "Forum not found." });
      if (!forum.isPublic || !forum.category.isPublic || !forum.category.section.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Forum not found." });
      }
      if (forum.isLocked || forum.category.isLocked || forum.category.section.isLocked) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Posting is locked in this forum." });
      }
      let slug = slugify(input.title);
      if (await ctx.db.thread.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
      const tagInputs = input.tags.map((name) => ({ name, slug: slugify(name) }));
      return ctx.db.$transaction(async (tx) => {
        const thread = await tx.thread.create({
          data: {
            forumId: forum.id,
            authorId: ctx.session.user.id,
            title: input.title,
            slug,
            tags: {
              connectOrCreate: tagInputs.map((tag) => ({
                where: { slug: tag.slug },
                create: tag,
              })),
            },
          },
        });
        await tx.post.create({
          data: { threadId: thread.id, authorId: ctx.session.user.id, content: input.content },
        });
        return thread;
      });
    }),

  updateOwn: protectedProcedure
    .input(threadContentSchema.extend({ threadId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      assertNotSuspended(ctx.session.user);

      const thread = await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        select: {
          id: true,
          authorId: true,
          isDeleted: true,
          forum: { select: { isPublic: true, category: { select: { isPublic: true, section: { select: { isPublic: true } } } } } },
        },
      });
      if (!thread || !isPublicThreadVisible(thread)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found." });
      }
      if (thread.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own threads." });
      }

      const originalPost = await ctx.db.post.findFirst({
        where: { threadId: thread.id },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, isDeleted: true },
      });
      if (!originalPost || originalPost.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread content not found." });
      }

      await ctx.db.$transaction([
        ctx.db.thread.update({
          where: { id: thread.id },
          data: { title: input.title },
        }),
        ctx.db.post.update({
          where: { id: originalPost.id },
          data: { content: input.content },
        }),
      ]);

      return { success: true };
    }),

  deleteOwn: protectedProcedure
    .input(z.object({ threadId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      assertNotSuspended(ctx.session.user);

      const thread = await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        select: {
          id: true,
          authorId: true,
          isDeleted: true,
          replyCount: true,
          forum: { select: { isPublic: true, category: { select: { isPublic: true, section: { select: { isPublic: true } } } } } },
        },
      });
      if (!thread || !isPublicThreadVisible(thread)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found." });
      }
      if (thread.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own threads." });
      }
      if (thread.replyCount !== 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Threads with replies cannot be deleted by their author.",
        });
      }

      await ctx.db.thread.update({
        where: { id: thread.id },
        data: { isDeleted: true },
      });

      return { success: true };
    }),
});
