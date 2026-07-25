import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";
import { assertNotSuspended } from "@/server/api/rate-limit";
import { VISIBLE_PUBLIC_THREAD } from "@/server/db/visibility";

const getPublicProfileSchema = z.object({
  username: z.string().min(1),
  tab: z.enum(["threads", "posts"]).default("threads"),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  image: z
    .string()
    .max(500)
    .refine(
      (v) => !v || v.startsWith("/uploads/") || v.startsWith("https://"),
      "Invalid image URL",
    )
    .optional(),
  digestFrequency: z.enum(["off", "daily", "weekly"]).optional(),
  emailOnReply: z.boolean().optional(),
});

export const userRouter = router({
  getPublicProfile: publicProcedure
    .input(getPublicProfileSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
        select: {
          id: true,
          username: true,
          displayName: true,
          image: true,
          bio: true,
          role: true,
          reputation: true,
          createdAt: true,
          badges: {
            include: { badge: true },
            orderBy: { awardedAt: "desc" },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      if (input.tab === "posts") {
        const posts = await ctx.db.post.findMany({
          where: {
            authorId: user.id,
            isDeleted: false,
            thread: VISIBLE_PUBLIC_THREAD,
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: input.limit + 1,
          ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
          select: {
            id: true,
            content: true,
            createdAt: true,
            thread: {
              select: {
                title: true,
                slug: true,
                forum: { select: { slug: true, name: true } },
              },
            },
          },
        });
        let nextCursor: string | null = null;
        if (posts.length > input.limit) nextCursor = posts.pop()!.id;
        return { ...user, threads: [], posts, nextCursor, nextThreadCursor: null };
      }

      const threads = await ctx.db.thread.findMany({
        where: { authorId: user.id, ...VISIBLE_PUBLIC_THREAD },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          forum: { select: { slug: true, name: true } },
        },
      });
      let nextCursor: string | null = null;
      if (threads.length > input.limit) nextCursor = threads.pop()!.id;
      return {
        ...user,
        threads,
        posts: [],
        nextCursor,
        nextThreadCursor: nextCursor,
      };
    }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      assertNotSuspended(ctx.session.user);

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          displayName: input.displayName,
          bio: input.bio,
          image: input.image,
          digestFrequency: input.digestFrequency,
          emailOnReply: input.emailOnReply,
        },
      });

      return { success: true };
    }),
});
