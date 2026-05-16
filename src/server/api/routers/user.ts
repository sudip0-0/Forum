import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";

const getPublicProfileSchema = z.object({
  username: z.string().min(1),
});

const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
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
          createdAt: true,
          threads: {
            where: {
              isDeleted: false,
              forum: { isPublic: true, category: { isPublic: true, section: { isPublic: true } } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              title: true,
              slug: true,
              createdAt: true,
              forum: { select: { slug: true, name: true } },
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      return user;
    }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          displayName: input.displayName,
          bio: input.bio,
        },
      });

      return { success: true };
    }),
});
