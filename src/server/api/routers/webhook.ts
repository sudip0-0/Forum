import crypto from "node:crypto";
import { z } from "zod";
import { roleProcedure, router } from "@/server/api/trpc";
import { assertSafeWebhookUrl } from "@/server/webhooks/dispatch";

export const webhookRouter = router({
  list: roleProcedure(["ADMIN"]).query(async ({ ctx }) => {
    return ctx.db.webhookEndpoint.findMany({ orderBy: { createdAt: "desc" } });
  }),

  create: roleProcedure(["ADMIN"])
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.string().min(1)).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertSafeWebhookUrl(input.url);
      return ctx.db.webhookEndpoint.create({
        data: {
          url: input.url,
          secret: crypto.randomBytes(24).toString("hex"),
          events: input.events,
        },
      });
    }),

  delete: roleProcedure(["ADMIN"])
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.webhookEndpoint.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
