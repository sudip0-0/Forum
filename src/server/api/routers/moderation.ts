import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  protectedProcedure,
  roleProcedure,
  router,
} from "@/server/api/trpc";

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

const listQueueSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

const resolveSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum([
    "DISMISS",
    "SOFT_DELETE_POST",
    "SOFT_DELETE_THREAD",
    "LOCK_THREAD",
  ]),
  reason: z.string().min(3).max(1000),
});

const listUsersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["MEMBER", "MODERATOR", "ADMIN"]),
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

  listQueue: roleProcedure(["MODERATOR", "ADMIN"])
    .input(listQueueSchema)
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.report.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          reporter: {
            select: { id: true, username: true, displayName: true },
          },
          post: {
            select: {
              id: true,
              content: true,
              isDeleted: true,
              thread: { select: { id: true, title: true, slug: true } },
            },
          },
          thread: {
            select: { id: true, title: true, slug: true, isDeleted: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (reports.length > input.limit) {
        nextCursor = reports.pop()!.id;
      }

      return { reports, nextCursor };
    }),

  resolve: roleProcedure(["MODERATOR", "ADMIN"])
    .input(resolveSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.report.findUnique({
        where: { id: input.reportId },
        include: {
          post: { select: { id: true, threadId: true } },
          thread: { select: { id: true, categoryId: true } },
        },
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found.",
        });
      }

      if (report.status !== "OPEN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Report is not open.",
        });
      }

      const newStatus =
        input.action === "DISMISS" ? ("DISMISSED" as const) : ("RESOLVED" as const);

      if (input.action === "SOFT_DELETE_POST" && !report.postId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete post: report has no associated post.",
        });
      }

      if (
        (input.action === "SOFT_DELETE_THREAD" || input.action === "LOCK_THREAD") &&
        !report.threadId
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot act on thread: report has no associated thread.",
        });
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.report.update({
          where: { id: input.reportId },
          data: {
            status: newStatus,
            resolvedAt: new Date(),
          },
        });

        const targetUserId = report.postId
          ? (
              await tx.post.findUnique({
                where: { id: report.postId! },
                select: { authorId: true },
              })
            )?.authorId ?? null
          : report.threadId
            ? (
                await tx.thread.findUnique({
                  where: { id: report.threadId! },
                  select: { authorId: true },
                })
              )?.authorId ?? null
            : null;

        await tx.moderationLog.create({
          data: {
            moderatorId: ctx.session.user.id,
            targetUserId,
            postId: report.postId,
            threadId: report.threadId,
            action: input.action,
            reason: input.reason,
          },
        });

        switch (input.action) {
          case "SOFT_DELETE_POST":
            await tx.post.update({
              where: { id: report.postId! },
              data: { isDeleted: true },
            });
            break;
          case "SOFT_DELETE_THREAD":
            await tx.thread.update({
              where: { id: report.threadId! },
              data: { isDeleted: true },
            });
            break;
          case "LOCK_THREAD":
            await tx.thread.update({
              where: { id: report.threadId! },
              data: { isLocked: true },
            });
            break;
        }
      });

      return { success: true };
    }),

  listUsers: roleProcedure(["ADMIN"])
    .input(listUsersSchema)
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (users.length > input.limit) {
        nextCursor = users.pop()!.id;
      }

      return { users, nextCursor };
    }),

  changeRole: roleProcedure(["ADMIN"])
    .input(changeRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      if (target.role === input.role) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has this role.",
        });
      }

      if (target.role === "ADMIN" && input.role !== "ADMIN") {
        const adminCount = await ctx.db.user.count({
          where: { role: "ADMIN" },
        });

        if (adminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot demote the last admin.",
          });
        }
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: input.userId },
          data: { role: input.role },
        });

        await tx.moderationLog.create({
          data: {
            moderatorId: ctx.session.user.id,
            targetUserId: input.userId,
            action: "ROLE_CHANGE",
            reason: `Changed role from ${target.role} to ${input.role}`,
            metadata: {
              previousRole: target.role,
              newRole: input.role,
            },
          },
        });
      });

      return { success: true };
    }),
});
