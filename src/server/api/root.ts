import { router } from "@/server/api/trpc";
import { healthRouter } from "@/server/api/routers/health";
import { categoryRouter } from "@/server/api/routers/category";

export const appRouter = router({
  health: healthRouter,
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;
