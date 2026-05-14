import { router } from "@/server/api/trpc";
import { healthRouter } from "@/server/api/routers/health";
import { categoryRouter } from "@/server/api/routers/category";
import { threadRouter } from "@/server/api/routers/thread";
import { postRouter } from "@/server/api/routers/post";

export const appRouter = router({
  health: healthRouter,
  category: categoryRouter,
  thread: threadRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
