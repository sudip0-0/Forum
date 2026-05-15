import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/server/api/trpc";

const emojiSchema = z.enum(["LIKE", "HELPFUL", "LAUGH", "INSIGHTFUL"]);
const targetSchema = z.object({
  postId: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  emoji: emojiSchema,
}).refine((value) => !!value.postId !== !!value.threadId, {
  message: "Provide exactly one target.",
});

export const reactionRouter = router({
  toggle: protectedProcedure.input(targetSchema).mutation(async ({ ctx, input }) => {
    const target = input.postId
      ? await ctx.db.post.findUnique({ where: { id: input.postId } })
      : await ctx.db.thread.findUnique({ where: { id: input.threadId! } });
    if (!target || target.isDeleted) throw new TRPCError({ code: "NOT_FOUND", message: "Target not found." });

    const where = input.postId
      ? { userId_postId: { userId: ctx.session.user.id, postId: input.postId } }
      : { userId_threadId: { userId: ctx.session.user.id, threadId: input.threadId! } };
    const existing = await ctx.db.reaction.findUnique({ where });
    if (existing) {
      if (existing.emoji === input.emoji) {
        await ctx.db.reaction.delete({ where: { id: existing.id } });
        return { active: false, emoji: null };
      }
      await ctx.db.reaction.update({
        where: { id: existing.id },
        data: { emoji: input.emoji },
      });
      return { active: true, emoji: input.emoji };
    }
    await ctx.db.reaction.create({
      data: {
        userId: ctx.session.user.id,
        postId: input.postId,
        threadId: input.threadId,
        emoji: input.emoji,
      },
    });
    return { active: true, emoji: input.emoji };
  }),
});
