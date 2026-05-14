import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/server/api/trpc";

const reportSchema = z
  .object({
    postId: z.string().min(1).optional(),
    threadId: z.string().min(1).optional(),
    reason: z.enum(["SPAM", "HARASSMENT", "OFF_TOPIC", "DUPLICATE", "OTHER"]),
    note: z.string().max(1000).optional(),
  })
  .refine((data) => (data.postId ? !data.threadId : !!data.threadId), {
    message: "Must provide exactly one of postId or threadId.",
  });

export const moderationRouter = router({
  report: protectedProcedure
    .input(reportSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.postId) {
        const post = await ctx.db.post.findUnique({
          where: { id: input.postId },
        });

        if (!post || post.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found.",
          });
        }

        if (post.authorId === ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot report your own content.",
          });
        }

        try {
          const report = await ctx.db.report.create({
            data: {
              reporterId: ctx.session.user.id,
              postId: input.postId,
              reason: input.reason,
              note: input.note ?? null,
              status: "OPEN",
            },
          });
          return report;
        } catch (e: unknown) {
          if (
            e instanceof Error &&
            "code" in e &&
            (e as { code: string }).code === "P2002"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You have already reported this post.",
            });
          }
          throw e;
        }
      }

      if (input.threadId) {
        const thread = await ctx.db.thread.findUnique({
          where: { id: input.threadId },
        });

        if (!thread || thread.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Thread not found.",
          });
        }

        if (thread.authorId === ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot report your own content.",
          });
        }

        try {
          const report = await ctx.db.report.create({
            data: {
              reporterId: ctx.session.user.id,
              threadId: input.threadId,
              reason: input.reason,
              note: input.note ?? null,
              status: "OPEN",
            },
          });
          return report;
        } catch (e: unknown) {
          if (
            e instanceof Error &&
            "code" in e &&
            (e as { code: string }).code === "P2002"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You have already reported this thread.",
            });
          }
          throw e;
        }
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Must provide either postId or threadId.",
      });
    }),
});
