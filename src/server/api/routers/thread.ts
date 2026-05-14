import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const listByCategorySchema = z.object({
  categorySlug: z.string().min(1),
  sort: z.enum(["latest", "newest", "unanswered"]).default("latest"),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

const createSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(5).max(150),
  content: z.string().min(10).max(20000),
});

const getBySlugSchema = z.object({
  slug: z.string().min(1),
});

export const threadRouter = router({
  listByCategory: publicProcedure
    .input(listByCategorySchema)
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { slug: input.categorySlug },
      });

      if (!category || !category.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." });
      }

      const orderBy =
        input.sort === "newest"
          ? { createdAt: "desc" as const }
          : { lastActivityAt: "desc" as const };

      const where: Record<string, unknown> = {
        categoryId: category.id,
        isDeleted: false,
      };

      if (input.sort === "unanswered") {
        where.replyCount = 0;
      }

      const threads = await ctx.db.thread.findMany({
        where,
        orderBy: [orderBy, { id: "desc" as const }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: { author: { select: { id: true, username: true, displayName: true } } },
      });

      let nextCursor: string | undefined;
      if (threads.length > input.limit) {
        nextCursor = threads.pop()!.id;
      }

      return { threads, nextCursor, category };
    }),

  getBySlug: publicProcedure
    .input(getBySlugSchema)
    .query(async ({ ctx, input }) => {
      const thread = await ctx.db.thread.findUnique({
        where: { slug: input.slug },
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          category: { select: { id: true, name: true, slug: true, isPublic: true } },
        },
      });

      if (!thread || thread.isDeleted || !thread.category.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found." });
      }

      return thread;
    }),

  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." });
      }

      if (category.isLocked) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Category is locked." });
      }

      let slug = slugify(input.title);
      const existing = await ctx.db.thread.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const thread = await ctx.db.$transaction(async (tx) => {
        const t = await tx.thread.create({
          data: {
            categoryId: input.categoryId,
            authorId: ctx.session.user.id,
            title: input.title,
            slug,
          },
        });

        await tx.post.create({
          data: {
            threadId: t.id,
            authorId: ctx.session.user.id,
            content: input.content,
          },
        });

        return t;
      });

      return thread;
    }),
});
