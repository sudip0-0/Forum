import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { protectedProcedure, router } from "@/server/api/trpc";
import { assertNotSuspended } from "@/server/api/rate-limit";
import { isPublicThreadVisible } from "@/server/db/visibility";

const emojiSchema = z.enum(["LIKE", "HELPFUL", "LAUGH", "INSIGHTFUL"]);
const targetSchema = z.object({
  postId: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  emoji: emojiSchema,
}).refine((value) => !!value.postId !== !!value.threadId, {
  message: "Provide exactly one target.",
});

const forumVisibilityInclude = {
  forum: {
    select: {
      isPublic: true,
      isDeleted: true,
      category: {
        select: {
          isPublic: true,
          isDeleted: true,
          section: { select: { isPublic: true, isDeleted: true } },
        },
      },
    },
  },
} as const;

export const reactionRouter = router({
  toggle: protectedProcedure.input(targetSchema).mutation(async ({ ctx, input }) => {
    assertNotSuspended(ctx.session.user);

    try {
      return await ctx.db.$transaction(async (tx) => {
        if (input.postId) {
          const post = await tx.post.findUnique({
            where: { id: input.postId },
            include: {
              thread: { include: forumVisibilityInclude },
            },
          });
          if (!post || post.isDeleted || !isPublicThreadVisible(post.thread)) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Target not found." });
          }
        } else {
          const thread = await tx.thread.findUnique({
            where: { id: input.threadId! },
            include: forumVisibilityInclude,
          });
          if (!thread || !isPublicThreadVisible(thread)) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Target not found." });
          }
        }

        const where = input.postId
          ? { userId_postId: { userId: ctx.session.user.id, postId: input.postId } }
          : { userId_threadId: { userId: ctx.session.user.id, threadId: input.threadId! } };
        const { adjustReputation } = await import("@/server/engagement/reputation");
        const existing = await tx.reaction.findUnique({ where });
        let targetAuthorId: string | null = null;
        if (input.postId) {
          const post = await tx.post.findUnique({
            where: { id: input.postId },
            select: { authorId: true },
          });
          targetAuthorId = post?.authorId ?? null;
        } else if (input.threadId) {
          const thread = await tx.thread.findUnique({
            where: { id: input.threadId },
            select: { authorId: true },
          });
          targetAuthorId = thread?.authorId ?? null;
        }

        if (existing) {
          if (existing.emoji === input.emoji) {
            await tx.reaction.delete({ where: { id: existing.id } });
            if (targetAuthorId && targetAuthorId !== ctx.session.user.id) {
              await adjustReputation(tx, targetAuthorId, -1);
            }
            return { active: false as const, emoji: null };
          }
          await tx.reaction.update({
            where: { id: existing.id },
            data: { emoji: input.emoji },
          });
          return { active: true as const, emoji: input.emoji };
        }
        await tx.reaction.create({
          data: {
            userId: ctx.session.user.id,
            postId: input.postId,
            threadId: input.threadId,
            emoji: input.emoji,
          },
        });
        if (targetAuthorId && targetAuthorId !== ctx.session.user.id) {
          await adjustReputation(tx, targetAuthorId, 1);
        }
        return { active: true as const, emoji: input.emoji };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // Concurrent create — re-read current state.
        const where = input.postId
          ? { userId_postId: { userId: ctx.session.user.id, postId: input.postId } }
          : { userId_threadId: { userId: ctx.session.user.id, threadId: input.threadId! } };
        const existing = await ctx.db.reaction.findUnique({ where });
        if (!existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Reaction conflict. Try again." });
        }
        if (existing.emoji === input.emoji) {
          return { active: true as const, emoji: input.emoji };
        }
        await ctx.db.reaction.update({
          where: { id: existing.id },
          data: { emoji: input.emoji },
        });
        return { active: true as const, emoji: input.emoji };
      }
      throw error;
    }
  }),
});
