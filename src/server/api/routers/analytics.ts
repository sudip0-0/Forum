import { roleProcedure, router } from "@/server/api/trpc";

export const analyticsRouter = router({
  summary: roleProcedure(["ADMIN"]).query(async ({ ctx }) => {
    const now = Date.now();
    const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const names = ["register", "thread.create", "search", "thread.view"] as const;
    const events: Record<string, { d7: number; d30: number }> = {};
    for (const name of names) {
      events[name] = {
        d7: await ctx.db.analyticsEvent.count({
          where: { name, createdAt: { gte: d7 } },
        }),
        d30: await ctx.db.analyticsEvent.count({
          where: { name, createdAt: { gte: d30 } },
        }),
      };
    }
    return {
      events,
      threads7: await ctx.db.thread.count({ where: { createdAt: { gte: d7 } } }),
      posts7: await ctx.db.post.count({ where: { createdAt: { gte: d7 } } }),
      users7: await ctx.db.user.count({ where: { createdAt: { gte: d7 } } }),
    };
  }),
});
