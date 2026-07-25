import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/server/api/trpc";
import {
  assertNotSuspended,
  checkRateLimit,
  type RateLimitConfig,
} from "@/server/api/rate-limit";

const RL_DM: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 60,
  keyPrefix: "dm-send",
};

export const messageRouter = router({
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const parts = await ctx.db.conversationParticipant.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, username: true, displayName: true, image: true },
                },
              },
            },
            messages: {
              where: { isDeleted: false },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });
    return parts.map((p) => ({
      id: p.conversationId,
      lastReadAt: p.lastReadAt,
      updatedAt: p.conversation.updatedAt,
      participants: p.conversation.participants.map((x) => x.user),
      lastMessage: p.conversation.messages[0] ?? null,
    }));
  }),

  openWithUsername: protectedProcedure
    .input(z.object({ username: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      assertNotSuspended(ctx.session.user);
      const other = await ctx.db.user.findUnique({
        where: { username: input.username },
        select: { id: true, isSuspended: true },
      });
      if (!other || other.isSuspended) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }
      if (other.id === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself." });
      }

      const existing = await ctx.db.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: ctx.session.user.id } } },
            { participants: { some: { userId: other.id } } },
          ],
        },
        select: { id: true },
      });
      if (existing) return existing;

      return ctx.db.conversation.create({
        data: {
          participants: {
            create: [{ userId: ctx.session.user.id }, { userId: other.id }],
          },
        },
        select: { id: true },
      });
    }),

  listMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const member = await ctx.db.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId: ctx.session.user.id,
          },
        },
      });
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await ctx.db.directMessage.findMany({
        where: { conversationId: input.conversationId, isDeleted: false },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          sender: { select: { id: true, username: true, displayName: true, image: true } },
        },
      });
      let nextCursor: string | null = null;
      if (messages.length > input.limit) nextCursor = messages.pop()!.id;
      return { messages: messages.reverse(), nextCursor };
    }),

  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
        body: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id, RL_DM);
      assertNotSuspended(ctx.session.user);
      const member = await ctx.db.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId: ctx.session.user.id,
          },
        },
      });
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });

      const message = await ctx.db.$transaction(async (tx) => {
        const msg = await tx.directMessage.create({
          data: {
            conversationId: input.conversationId,
            senderId: ctx.session.user.id,
            body: input.body,
          },
        });
        await tx.conversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        });
        return msg;
      });
      return message;
    }),

  markRead: protectedProcedure
    .input(z.object({ conversationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId: ctx.session.user.id,
        },
        data: { lastReadAt: new Date() },
      });
      return { success: true };
    }),
});
