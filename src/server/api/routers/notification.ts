import { z } from "zod";
import { protectedProcedure, router } from "@/server/api/trpc";
import { ensureThreadSubscription } from "@/server/notifications/create";

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.notification.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          actor: { select: { username: true, displayName: true, image: true } },
          thread: { select: { slug: true, title: true, forum: { select: { slug: true } } } },
        },
      });
      let nextCursor: string | null = null;
      if (items.length > input.limit) nextCursor = items.pop()!.id;
      return { items, nextCursor };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: { userId: ctx.session.user.id, readAt: null },
    });
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { readAt: new Date() },
      });
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: { userId: ctx.session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }),

  toggleSubscription: protectedProcedure
    .input(z.object({ threadId: z.string().min(1), subscribe: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.subscribe) {
        await ensureThreadSubscription(ctx.db, ctx.session.user.id, input.threadId);
      } else {
        await ctx.db.threadSubscription.deleteMany({
          where: { userId: ctx.session.user.id, threadId: input.threadId },
        });
      }
      return { success: true };
    }),
});
