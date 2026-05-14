import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";

export const healthRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }),

  authCheck: protectedProcedure.query(({ ctx }) => {
    return {
      authenticated: true,
      userId: ctx.session.user.id,
      email: ctx.session.user.email,
      role: ctx.session.user.role,
    };
  }),
});
